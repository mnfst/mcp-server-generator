import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tool } from './entities/tool.entity';
import { CanvasNode } from '../canvas/entities/canvas-node.entity';
import { ToolTestResult } from 'shared';
import { CreateToolDto } from '../dtos';
import { MCPServersService } from '../mcp-servers/mcp-servers.service';
import { DatasourcesService } from '../datasources/datasources.service';
import { QueryGenerationService } from '../query-generation/query-generation.service';
import { SchemaService } from '../schema/schema.service';
import * as mysql from 'mysql2/promise';

/**
 * Service for managing SQL query tools within MCP servers.
 *
 * Features:
 * - Tool creation with LLM-generated SQL
 * - Name uniqueness validation within MCP server
 * - Tool testing with parameter substitution
 * - Query execution with result limiting
 * - Automatic MCP server status updates
 */
@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(Tool)
    private toolRepository: Repository<Tool>,
    @InjectDataSource()
    private dataSource: DataSource,
    @Inject(forwardRef(() => MCPServersService))
    private mcpServersService: MCPServersService,
    private datasourcesService: DatasourcesService,
    private queryGenerationService: QueryGenerationService,
    private schemaService: SchemaService,
  ) {}

  /**
   * Creates a new tool by generating SQL from natural language prompt.
   *
   * Process:
   * 1. Validates MCP server exists
   * 2. Checks tool name uniqueness within server
   * 3. Fetches database schema
   * 4. Generates SQL query using LLM
   * 5. Saves tool and updates MCP server status to draft
   *
   * @param createToolDto - Tool creation data with prompt
   * @returns Promise<Tool> newly created tool with generated SQL
   * @throws NotFoundException if MCP server doesn't exist
   * @throws ConflictException if tool name already exists
   * @throws BadRequestException if query generation fails
   */
  async create(createToolDto: CreateToolDto): Promise<Tool> {
    // Validate MCP server exists and get datasource
    const mcpServer = await this.mcpServersService.findOne(
      createToolDto.mcpServerId,
    );
    if (!mcpServer) {
      throw new NotFoundException(
        `MCP Server with ID ${createToolDto.mcpServerId} not found`,
      );
    }

    // Check if tool name already exists for this server
    const existingTool = await this.toolRepository.findOne({
      where: {
        mcpServerId: createToolDto.mcpServerId,
        name: createToolDto.name,
      },
    });

    if (existingTool) {
      throw new ConflictException(
        `Tool with name "${createToolDto.name}" already exists for this MCP server`,
      );
    }

    // Get database schema for LLM context
    const schema = await this.schemaService.getSchema(mcpServer.datasourceId);

    // Generate SQL query using LLM
    const generationResult = await this.queryGenerationService.generateQuery(
      createToolDto.prompt,
      schema,
    );

    // Create tool entity
    const tool = this.toolRepository.create({
      name: createToolDto.name,
      description: createToolDto.description,
      mcpServerId: createToolDto.mcpServerId,
      prompt: createToolDto.prompt,
      sqlQuery: generationResult.sqlQuery,
      parameters: generationResult.parameters,
    });

    const savedTool = await this.toolRepository.save(tool);

    // Update MCP server status to draft (requires reactivation)
    await this.mcpServersService.update(createToolDto.mcpServerId, {
      status: 'draft' as any,
    });

    return savedTool;
  }

  /**
   * Retrieves all tools, optionally filtered by MCP server ID.
   *
   * @param mcpServerId - Optional MCP server ID to filter by
   * @returns Promise<Tool[]> array of tools
   */
  async findAll(mcpServerId?: string): Promise<Tool[]> {
    if (mcpServerId) {
      return this.toolRepository.find({
        where: { mcpServerId },
        order: { createdAt: 'DESC' },
      });
    }
    return this.toolRepository.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Retrieves a single tool by ID.
   *
   * @param id - Tool UUID
   * @returns Promise<Tool> the tool entity
   * @throws NotFoundException if tool doesn't exist
   */
  async findOne(id: string): Promise<Tool> {
    const tool = await this.toolRepository.findOne({ where: { id } });
    if (!tool) {
      throw new NotFoundException(`Tool with ID ${id} not found`);
    }
    return tool;
  }

  /**
   * Updates a tool, optionally regenerating SQL if prompt changed.
   *
   * @param id - Tool UUID
   * @param updateData - Partial tool data to update
   * @returns Promise<Tool> updated tool
   * @throws NotFoundException if tool doesn't exist
   */
  async update(id: string, updateData: Partial<Tool>): Promise<Tool> {
    const tool = await this.findOne(id);

    // If prompt changed, regenerate SQL query
    if (updateData.prompt && updateData.prompt !== tool.prompt) {
      const mcpServer = await this.mcpServersService.findOne(tool.mcpServerId);
      const schema = await this.schemaService.getSchema(
        mcpServer.datasourceId,
      );

      const generationResult = await this.queryGenerationService.generateQuery(
        updateData.prompt,
        schema,
      );

      updateData.sqlQuery = generationResult.sqlQuery;
      updateData.parameters = generationResult.parameters;
    }

    Object.assign(tool, updateData);
    const updatedTool = await this.toolRepository.save(tool);

    // Update MCP server status to draft
    await this.mcpServersService.update(tool.mcpServerId, {
      status: 'draft' as any,
    });

    return updatedTool;
  }

  /**
   * Deletes a tool from the system.
   *
   * @param id - Tool UUID
   * @returns Promise<void>
   * @throws NotFoundException if tool doesn't exist
   */
  async delete(id: string): Promise<void> {
    const tool = await this.findOne(id);

    // Delete associated canvas node first
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(CanvasNode)
      .where('toolId = :id', { id })
      .execute();

    const result = await this.toolRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Tool with ID ${id} not found`);
    }

    // Update MCP server status to draft
    await this.mcpServersService.update(tool.mcpServerId, {
      status: 'draft' as any,
    });
  }

  /**
   * Tests a tool by executing its SQL query with provided parameter values.
   * Returns first 10 rows with execution time.
   *
   * @param id - Tool UUID
   * @param parameterValues - Object mapping parameter names to values
   * @returns Promise<ToolTestResult> with query results
   * @throws NotFoundException if tool doesn't exist
   */
  async testTool(
    id: string,
    parameterValues: Record<string, any> = {},
  ): Promise<ToolTestResult> {
    const tool = await this.findOne(id);

    // Get MCP server and datasource
    const mcpServer = await this.mcpServersService.findOne(tool.mcpServerId);
    const datasource = await this.datasourcesService.findOne(
      mcpServer.datasourceId,
    );
    const password = await this.datasourcesService.getDecryptedPassword(
      mcpServer.datasourceId,
    );

    // Create connection
    const connection = await mysql.createConnection({
      host: datasource.host,
      port: datasource.port,
      user: datasource.username,
      password,
      database: datasource.database,
    });

    try {
      // Replace parameter placeholders with values
      let query = tool.sqlQuery;
      const values: any[] = [];

      if (tool.parameters) {
        for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
          const placeholder = `:${paramName}`;
          if (query.includes(placeholder)) {
            const value = parameterValues[paramName];

            // Validate required parameters
            if (paramDef.required && (value === undefined || value === null)) {
              throw new BadRequestException(
                `Required parameter "${paramName}" is missing`,
              );
            }

            // Replace placeholder with ? for prepared statement
            query = query.replace(new RegExp(placeholder, 'g'), '?');
            values.push(value ?? paramDef.defaultValue);
          }
        }
      }

      // Add LIMIT if not present
      if (!query.toUpperCase().includes('LIMIT')) {
        query += ' LIMIT 10';
      }

      // Execute query with timing
      const startTime = Date.now();
      const [rows] = await connection.execute(query, values);
      const executionTime = Date.now() - startTime;

      const rowsArray = Array.isArray(rows) ? rows : [];

      return {
        success: true,
        rows: rowsArray.slice(0, 10),
        rowCount: rowsArray.length,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        rows: [],
        rowCount: 0,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      await connection.end();
    }
  }
}
