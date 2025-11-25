import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ToolsService } from '../tools/tools.service';
import { ResourcesService } from '../resources/resources.service';
import { Resource } from '../resources/entities/resource.entity';
import { Tool, ToolParameter } from 'shared';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Service responsible for managing MCP server runtime instances.
 *
 * Features:
 * - Creates and manages in-memory MCP server instances
 * - Registers request handlers for tools/list and tools/call
 * - Converts tool definitions to MCP protocol format
 * - Executes SQL queries through the tools system
 */
@Injectable()
export class MCPRuntimeService {
  private readonly logger = new Logger(MCPRuntimeService.name);
  /** In-memory map of active MCP server instances indexed by slug */
  private readonly servers = new Map<string, any>();

  constructor(
    @Inject(forwardRef(() => ToolsService))
    private readonly toolsService: ToolsService,
    @Inject(forwardRef(() => ResourcesService))
    private readonly resourcesService: ResourcesService,
  ) {}

  /**
   * Starts a new MCP server runtime instance.
   *
   * Process:
   * 1. Creates a new Server instance from MCP SDK
   * 2. Loads all tools associated with this MCP server
   * 3. Registers tools/list handler to return available tools
   * 4. Registers tools/call handler to execute SQL queries
   * 5. Stores server instance in memory map
   *
   * @param slug - Unique slug for the server instance
   * @param mcpServerId - Database ID of the MCP server entity
   * @param config - Server configuration with name and version
   * @throws Error if server startup fails
   */
  async startServer(
    slug: string,
    mcpServerId: string,
    config: { name: string; version: string },
  ): Promise<void> {
    try {
      // Create new MCP server instance with tools and resources capabilities
      const server = new Server(
        {
          name: config.name,
          version: config.version || '1.0.0',
        },
        {
          capabilities: {
            tools: {},
            resources: {},
          },
        },
      );

      // Fetch all tools for this MCP server
      const tools = await this.toolsService.findAll(mcpServerId);
      this.logger.log(
        `Loaded ${tools.length} tools for MCP server ${slug} (ID: ${mcpServerId})`,
      );

      // Fetch all resources for this MCP server
      const resources = await this.resourcesService.findAll(mcpServerId);
      this.logger.log(
        `Loaded ${resources.length} resources for MCP server ${slug} (ID: ${mcpServerId})`,
      );

      // Register tools/list handler
      server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
          tools: tools.map((tool) => this.convertToolToMCPFormat(tool)),
        };
      });

      // Register tools/call handler
      server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const toolName = request.params.name;
        const parameters = (request.params.arguments as Record<string, any>) || {};

        // Find the tool by name
        const tool = tools.find((t) => t.name === toolName);
        if (!tool) {
          throw new Error(`Tool "${toolName}" not found`);
        }

        // Execute the tool using ToolsService
        const result = await this.toolsService.testTool(tool.id, parameters);

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Error executing tool: ${result.error || 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }

        // Format the result as MCP tool response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  rows: result.rows,
                  rowCount: result.rowCount,
                  executionTime: `${result.executionTime}ms`,
                },
                null,
                2,
              ),
            },
          ],
        };
      });

      // Register resources/list handler
      server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
          resources: resources.map((resource) => this.convertResourceToMCPFormat(resource)),
        };
      });

      // Register resources/read handler
      server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri;

        // Parse resource ID from URI (format: resource://{id})
        const match = uri.match(/^resource:\/\/(.+)$/);
        if (!match) {
          throw new Error(`Invalid resource URI format: ${uri}`);
        }
        const resourceId = match[1];

        // Find the resource
        const resource = resources.find((r) => r.id === resourceId);
        if (!resource) {
          throw new Error(`Resource not found: ${uri}`);
        }

        // Read the file content
        const filePath = join(process.cwd(), 'public', resource.filePath);
        const fileContent = await readFile(filePath);

        // Determine if content should be text or blob based on MIME type
        const isTextMimeType = resource.mimeType.startsWith('text/') ||
          resource.mimeType === 'application/json' ||
          resource.mimeType === 'application/xml' ||
          resource.mimeType === 'application/javascript';

        if (isTextMimeType) {
          return {
            contents: [
              {
                uri,
                mimeType: resource.mimeType,
                text: fileContent.toString('utf-8'),
              },
            ],
          };
        } else {
          // Return as base64-encoded blob
          return {
            contents: [
              {
                uri,
                mimeType: resource.mimeType,
                blob: fileContent.toString('base64'),
              },
            ],
          };
        }
      });

      // Store server instance along with tools and resources arrays for request handling
      this.servers.set(slug, { server, tools, resources, mcpServerId });
      this.logger.log(`MCP server started for slug: ${slug} with ${tools.length} tools and ${resources.length} resources`);
    } catch (error) {
      this.logger.error(`Failed to start MCP server for slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Converts a Tool entity to MCP SDK tool format with JSON schema.
   *
   * @param tool - Tool entity to convert
   * @returns MCP tool object with name, description, and JSON schema input specification
   */
  private convertToolToMCPFormat(tool: Tool) {
    const inputSchema: any = {
      type: 'object',
      properties: {},
      required: [],
    };

    if (tool.parameters) {
      for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
        inputSchema.properties[paramName] = this.convertParameterToJsonSchema(paramDef);
        if (paramDef.required) {
          inputSchema.required.push(paramName);
        }
      }
    }

    return {
      name: tool.name,
      description: tool.description,
      inputSchema,
    };
  }

  /**
   * Converts a ToolParameter to JSON Schema format.
   *
   * @param param - Tool parameter definition
   * @returns JSON Schema object for the parameter
   */
  private convertParameterToJsonSchema(param: ToolParameter) {
    const schema: any = {
      description: param.description,
    };

    switch (param.type) {
      case 'string':
        schema.type = 'string';
        break;
      case 'number':
        schema.type = 'number';
        break;
      case 'boolean':
        schema.type = 'boolean';
        break;
      case 'date':
        schema.type = 'string';
        schema.format = 'date';
        break;
    }

    if (param.defaultValue !== undefined) {
      schema.default = param.defaultValue;
    }

    return schema;
  }

  /**
   * Converts a Resource entity to MCP SDK resource format.
   *
   * @param resource - Resource entity to convert
   * @returns MCP resource object with uri, name, description, and mimeType
   */
  private convertResourceToMCPFormat(resource: Resource) {
    return {
      uri: `resource://${resource.id}`,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    };
  }

  /**
   * Stops an MCP server runtime instance and removes it from memory.
   *
   * @param slug - Unique slug of the server to stop
   */
  async stopServer(slug: string): Promise<void> {
    const serverData = this.servers.get(slug);
    if (serverData) {
      try {
        await serverData.server.close();
      } catch (error) {
        this.logger.warn(`Error closing server ${slug}: ${error}`);
      }
      this.servers.delete(slug);
      this.logger.log(`MCP server stopped for slug: ${slug}`);
    }
  }

  /**
   * Reloads all active MCP servers (typically called on backend startup).
   *
   * @param serverConfigs - Array of server configurations to reload
   */
  async reloadAllServers(
    serverConfigs: Array<{ slug: string; mcpServerId: string; config: any }>,
  ): Promise<void> {
    this.logger.log('Reloading all MCP servers on backend startup...');
    for (const { slug, mcpServerId, config } of serverConfigs) {
      try {
        await this.startServer(slug, mcpServerId, config);
      } catch (error) {
        this.logger.error(`Failed to reload server ${slug}:`, error);
      }
    }
  }

  /**
   * Gets the runtime status of an MCP server.
   *
   * @param slug - Unique slug of the server
   * @returns 'active' if server is running, 'inactive' otherwise
   */
  getServerStatus(slug: string): 'active' | 'inactive' {
    return this.servers.has(slug) ? 'active' : 'inactive';
  }

  /**
   * Retrieves a running MCP server instance from memory.
   *
   * @param slug - Unique slug of the server
   * @returns Server instance if running, undefined otherwise
   */
  getServer(slug: string): any | undefined {
    return this.servers.get(slug);
  }

  /**
   * Handles tools/list JSON-RPC requests by returning all available tools for a server.
   *
   * @param slug - Unique slug of the server
   * @returns Tools list result in MCP format
   */
  async handleToolsList(slug: string): Promise<any> {
    const serverData = this.servers.get(slug);
    if (!serverData) {
      throw new Error('Server not found');
    }

    return {
      tools: serverData.tools.map((tool: any) => this.convertToolToMCPFormat(tool)),
    };
  }

  /**
   * Handles tools/call JSON-RPC requests by executing a specific tool.
   *
   * @param slug - Unique slug of the server
   * @param params - Tool call parameters including name and arguments
   * @returns Tool execution result in MCP format
   */
  async handleToolsCall(slug: string, params: any): Promise<any> {
    const serverData = this.servers.get(slug);
    if (!serverData) {
      throw new Error('Server not found');
    }

    const toolName = params.name;
    const parameters = params.arguments || {};

    // Find the tool by name
    const tool = serverData.tools.find((t: any) => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found`);
    }

    // Execute the tool using ToolsService
    const result = await this.toolsService.testTool(tool.id, parameters);

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool: ${result.error || 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }

    // Format the result as MCP tool response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              rows: result.rows,
              rowCount: result.rowCount,
              executionTime: `${result.executionTime}ms`,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  /**
   * Handles resources/list JSON-RPC requests by returning all available resources for a server.
   *
   * @param slug - Unique slug of the server
   * @returns Resources list result in MCP format
   */
  async handleResourcesList(slug: string): Promise<any> {
    const serverData = this.servers.get(slug);
    if (!serverData) {
      throw new Error('Server not found');
    }

    // Fetch fresh resources from the database to get any newly added resources
    const resources = await this.resourcesService.findAll(serverData.mcpServerId);

    return {
      resources: resources.map((resource: Resource) => this.convertResourceToMCPFormat(resource)),
    };
  }

  /**
   * Handles resources/read JSON-RPC requests by reading and returning resource content.
   *
   * @param slug - Unique slug of the server
   * @param params - Resource read parameters including uri
   * @returns Resource content in MCP format (text or base64 blob)
   */
  async handleResourcesRead(slug: string, params: { uri: string }): Promise<any> {
    const serverData = this.servers.get(slug);
    if (!serverData) {
      throw new Error('Server not found');
    }

    const uri = params.uri;

    // Parse resource ID from URI (format: resource://{id})
    const match = uri.match(/^resource:\/\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid resource URI format: ${uri}`);
    }
    const resourceId = match[1];

    // Find the resource in the database
    const resource = await this.resourcesService.findOne(resourceId);

    // Read the file content
    const filePath = join(process.cwd(), 'public', resource.filePath);
    const fileContent = await readFile(filePath);

    // Determine if content should be text or blob based on MIME type
    const isTextMimeType = resource.mimeType.startsWith('text/') ||
      resource.mimeType === 'application/json' ||
      resource.mimeType === 'application/xml' ||
      resource.mimeType === 'application/javascript';

    if (isTextMimeType) {
      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType,
            text: fileContent.toString('utf-8'),
          },
        ],
      };
    } else {
      // Return as base64-encoded blob
      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType,
            blob: fileContent.toString('base64'),
          },
        ],
      };
    }
  }
}
