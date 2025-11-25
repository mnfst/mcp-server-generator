import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { MCPServer } from "./entities/mcp-server.entity";
import { Tool } from "../tools/entities/tool.entity";
import { MCPServerStatus, CanvasNodeType } from "shared";
import { CreateMCPServerDto } from "../dtos";
import { DatasourcesService } from "../datasources/datasources.service";
import { MCPRuntimeService } from "./mcp-runtime.service";
import { CanvasService } from "../canvas/canvas.service";
import { CanvasNode } from "../canvas/entities/canvas-node.entity";
import { ResourcesService } from "../resources/resources.service";

@Injectable()
export class MCPServersService implements OnModuleInit {
  private readonly logger = new Logger(MCPServersService.name);
  /**
   * Creates a new instance of MCPServersService.
   *
   * @param mcpServerRepository - The TypeORM repository for managing MCPServer entities
   * @param datasourcesService - The service for datasource operations and validation
   * @param mcpRuntimeService - The service for managing MCP server runtime lifecycle
   * @param canvasService - The service for managing canvas nodes
   * @param resourcesService - The service for managing resources (used for cascade delete)
   */
  constructor(
    @InjectRepository(MCPServer)
    private mcpServerRepository: Repository<MCPServer>,
    @InjectDataSource()
    private dataSource: DataSource,
    private datasourcesService: DatasourcesService,
    private mcpRuntimeService: MCPRuntimeService,
    private canvasService: CanvasService,
    @Inject(forwardRef(() => ResourcesService))
    private resourcesService: ResourcesService
  ) {}

  /**
   * Lifecycle hook that runs when the module is initialized.
   * Automatically reloads all active MCP servers on backend startup.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log("Reloading active MCP servers on startup...");

    const activeServers = await this.mcpServerRepository.find({
      where: { status: MCPServerStatus.ACTIVE },
    });

    for (const server of activeServers) {
      try {
        await this.mcpRuntimeService.startServer(server.slug, server.id, {
          name: server.name,
          version: "1.0.0",
        });
        this.logger.log(`Reloaded MCP server: ${server.name} (${server.slug})`);
      } catch (error) {
        this.logger.error(`Failed to reload MCP server ${server.slug}:`, error);
      }
    }

    this.logger.log(`Reloaded ${activeServers.length} active MCP server(s)`);
  }

  /**
   * Generates a URL-safe slug from a base name.
   * Converts to lowercase, replaces non-alphanumeric characters with hyphens, and removes leading/trailing hyphens.
   *
   * @param baseName - The original name to convert into a slug
   * @returns A URL-safe slug string
   */
  private generateSlug(baseName: string): string {
    return baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Creates a new MCP server associated with a datasource.
   * Validates that the datasource exists, generates a unique slug, and initializes the server in draft status.
   *
   * @param createMCPServerDto - The data transfer object containing MCP server creation details
   * @returns A promise that resolves to the newly created MCPServer entity
   * @throws {NotFoundException} When the specified datasource does not exist
   */
  async create(createMCPServerDto: CreateMCPServerDto): Promise<MCPServer> {
    // Validate datasource exists
    const datasource = await this.datasourcesService.findOne(
      createMCPServerDto.datasourceId
    );

    // Generate slug from datasource name with conflict resolution
    let slug = this.generateSlug(datasource.name);
    let counter = 1;
    while (await this.mcpServerRepository.findOne({ where: { slug } })) {
      slug = `${this.generateSlug(datasource.name)}-${counter}`;
      counter++;
    }

    const mcpServer = this.mcpServerRepository.create({
      name: `${datasource.name} MCP Server`,
      slug,
      datasourceId: createMCPServerDto.datasourceId,
      config: null,
      status: MCPServerStatus.DRAFT,
      mcpEndpoint: `/mcp/${slug}`,
    });

    const savedServer = await this.mcpServerRepository.save(mcpServer);

    // Automatically create a canvas node for this MCP server
    await this.canvasService.create({
      nodeId: `mcpServer-${savedServer.id}`,
      type: CanvasNodeType.MCP_SERVER,
      positionX: 300,
      positionY: 100,
      mcpServerId: savedServer.id,
    });

    return savedServer;
  }

  /**
   * Retrieves all MCP servers from the system, optionally filtered by datasource ID.
   *
   * @param datasourceId - Optional datasource ID to filter MCP servers by
   * @returns A promise that resolves to an array of MCPServer entities
   */
  async findAll(datasourceId?: string): Promise<MCPServer[]> {
    if (datasourceId) {
      return this.mcpServerRepository.find({ where: { datasourceId } });
    }
    return this.mcpServerRepository.find();
  }

  /**
   * Retrieves a specific MCP server by its unique identifier.
   *
   * @param id - The unique identifier of the MCP server to retrieve
   * @returns A promise that resolves to the MCPServer entity
   * @throws {NotFoundException} When no MCP server exists with the provided ID
   */
  async findOne(id: string): Promise<MCPServer> {
    const mcpServer = await this.mcpServerRepository.findOne({ where: { id } });
    if (!mcpServer) {
      throw new NotFoundException(`MCP Server with ID ${id} not found`);
    }
    return mcpServer;
  }

  /**
   * Retrieves a specific MCP server by its unique slug.
   * Slugs are used in the MCP endpoint URLs for routing requests.
   *
   * @param slug - The unique slug of the MCP server to retrieve
   * @returns A promise that resolves to the MCPServer entity
   * @throws {NotFoundException} When no MCP server exists with the provided slug
   */
  async findBySlug(slug: string): Promise<MCPServer> {
    const mcpServer = await this.mcpServerRepository.findOne({
      where: { slug },
    });
    if (!mcpServer) {
      throw new NotFoundException(`MCP Server with slug ${slug} not found`);
    }
    return mcpServer;
  }

  /**
   * Updates an existing MCP server with partial data.
   * Any update will reset the server status to draft, requiring reactivation.
   *
   * @param id - The unique identifier of the MCP server to update
   * @param updateData - Partial MCPServer data containing the fields to update
   * @returns A promise that resolves to the updated MCPServer entity
   * @throws {NotFoundException} When no MCP server exists with the provided ID
   */
  async update(id: string, updateData: Partial<MCPServer>): Promise<MCPServer> {
    const mcpServer = await this.findOne(id);
    Object.assign(mcpServer, updateData);
    mcpServer.status = MCPServerStatus.DRAFT;
    return this.mcpServerRepository.save(mcpServer);
  }

  /**
   * Deletes an MCP server from the system.
   * If the server is currently active, it will be stopped before deletion.
   * Also cascades deletion to all associated resources.
   *
   * @param id - The unique identifier of the MCP server to delete
   * @returns A promise that resolves when the MCP server is successfully deleted
   * @throws {NotFoundException} When no MCP server exists with the provided ID
   * @throws {BadRequestException} If tools exist for this MCP server
   */
  async delete(id: string): Promise<void> {
    const mcpServer = await this.findOne(id);

    // Check if any tools exist for this MCP server
    const toolCount = await this.dataSource
      .createQueryBuilder()
      .select("COUNT(*)", "count")
      .from(Tool, "tool")
      .where("tool.mcpServerId = :id", { id })
      .getRawOne()
      .then((result) => parseInt(result.count, 10));

    if (toolCount > 0) {
      throw new BadRequestException(
        `Cannot delete MCP server: ${toolCount} tool(s) are still using this MCP server. Delete the tools first.`
      );
    }

    // Stop the server if it's running
    if (mcpServer.status === MCPServerStatus.ACTIVE) {
      await this.mcpRuntimeService.stopServer(mcpServer.slug);
    }

    // Cascade delete all resources associated with this MCP server
    const resources = await this.resourcesService.findByMcpServerId(id);
    for (const resource of resources) {
      await this.resourcesService.delete(resource.id);
    }

    // Delete associated canvas node first (foreign key constraint)
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(CanvasNode)
      .where("mcpServerId = :id", { id })
      .execute();

    const result = await this.mcpServerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MCP Server with ID ${id} not found`);
    }
  }

  /**
   * Activates an MCP server, making it available to handle requests.
   * Starts the server runtime with the configured parameters and updates the status.
   *
   * @param id - The unique identifier of the MCP server to activate
   * @returns A promise that resolves to the updated MCPServer entity with active status
   * @throws {NotFoundException} When no MCP server exists with the provided ID
   * @throws {BadRequestException} When the server fails to start or activate
   */
  async activate(id: string): Promise<MCPServer> {
    const mcpServer = await this.findOne(id);

    try {
      // Start the MCP server with tools
      await this.mcpRuntimeService.startServer(mcpServer.slug, mcpServer.id, {
        name: mcpServer.name,
        version: "1.0.0",
      });

      mcpServer.status = MCPServerStatus.ACTIVE;
      return this.mcpServerRepository.save(mcpServer);
    } catch (error) {
      mcpServer.status = MCPServerStatus.ERROR;
      await this.mcpServerRepository.save(mcpServer);
      throw new BadRequestException("Failed to activate MCP server");
    }
  }

  /**
   * Deactivates an MCP server, stopping its runtime and resetting its status to draft.
   *
   * @param id - The unique identifier of the MCP server to deactivate
   * @returns A promise that resolves to the updated MCPServer entity with draft status
   * @throws {NotFoundException} When no MCP server exists with the provided ID
   */
  async deactivate(id: string): Promise<MCPServer> {
    const mcpServer = await this.findOne(id);

    // Stop the server if it's running
    if (mcpServer.status === MCPServerStatus.ACTIVE) {
      await this.mcpRuntimeService.stopServer(mcpServer.slug);
    }

    mcpServer.status = MCPServerStatus.DRAFT;
    return this.mcpServerRepository.save(mcpServer);
  }
}
