import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ToolsService } from '../tools/tools.service';
import { Tool, ToolParameter } from 'shared';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

@Injectable()
export class MCPRuntimeService {
  private readonly logger = new Logger(MCPRuntimeService.name);
  private readonly servers = new Map<string, any>();

  constructor(
    @Inject(forwardRef(() => ToolsService))
    private readonly toolsService: ToolsService,
  ) {}

  async startServer(
    slug: string,
    mcpServerId: string,
    config: { name: string; version: string },
  ): Promise<void> {
    try {
      // Create new MCP server instance
      const server = new Server(
        {
          name: config.name,
          version: config.version || '1.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        },
      );

      // Fetch all tools for this MCP server
      const tools = await this.toolsService.findAll(mcpServerId);
      this.logger.log(
        `Loaded ${tools.length} tools for MCP server ${slug} (ID: ${mcpServerId})`,
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

      this.servers.set(slug, server);
      this.logger.log(`MCP server started for slug: ${slug} with ${tools.length} tools`);
    } catch (error) {
      this.logger.error(`Failed to start MCP server for slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Converts a Tool entity to MCP SDK tool format with JSON schema.
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

  async stopServer(slug: string): Promise<void> {
    const server = this.servers.get(slug);
    if (server) {
      await server.close();
      this.servers.delete(slug);
      this.logger.log(`MCP server stopped for slug: ${slug}`);
    }
  }

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

  getServerStatus(slug: string): 'active' | 'inactive' {
    return this.servers.has(slug) ? 'active' : 'inactive';
  }

  getServer(slug: string): any | undefined {
    return this.servers.get(slug);
  }
}
