import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto, Tool, ToolTestResult } from 'shared';

/**
 * Controller for tool management endpoints.
 * Provides APIs for creating, testing, and managing SQL query tools.
 */
@Controller('api/tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  /**
   * POST /api/tools
   * Creates a new tool with LLM-generated SQL from natural language prompt.
   *
   * @param createToolDto - Tool creation data including prompt
   * @returns Created tool with generated SQL query
   */
  @Post()
  async create(@Body() createToolDto: CreateToolDto): Promise<Tool> {
    return this.toolsService.create(createToolDto);
  }

  /**
   * GET /api/tools
   * Retrieves all tools, optionally filtered by MCP server ID.
   *
   * @param mcpServerId - Optional query parameter to filter by MCP server
   * @returns Array of tools
   */
  @Get()
  async findAll(@Query('mcpServerId') mcpServerId?: string): Promise<Tool[]> {
    return this.toolsService.findAll(mcpServerId);
  }

  /**
   * GET /api/tools/:id
   * Retrieves a single tool by ID.
   *
   * @param id - Tool UUID
   * @returns Tool entity with all details
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Tool> {
    return this.toolsService.findOne(id);
  }

  /**
   * PATCH /api/tools/:id
   * Updates a tool. If prompt is changed, regenerates SQL query.
   *
   * @param id - Tool UUID
   * @param updateData - Partial tool data to update
   * @returns Updated tool
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<Tool>,
  ): Promise<Tool> {
    return this.toolsService.update(id, updateData);
  }

  /**
   * DELETE /api/tools/:id
   * Deletes a tool from the system.
   *
   * @param id - Tool UUID
   * @returns void
   */
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.toolsService.delete(id);
  }

  /**
   * POST /api/tools/:id/test
   * Tests a tool by executing its SQL query with provided parameters.
   * Returns first 10 rows with execution time.
   *
   * @param id - Tool UUID
   * @param body - Object containing parameter values
   * @returns Test result with rows, count, and execution time
   */
  @Post(':id/test')
  async testTool(
    @Param('id') id: string,
    @Body() body: { parameters?: Record<string, any> },
  ): Promise<ToolTestResult> {
    return this.toolsService.testTool(id, body.parameters || {});
  }
}
