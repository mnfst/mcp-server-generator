import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MCPServersService } from './mcp-servers.service';
import { MCPRuntimeService } from './mcp-runtime.service';
import { CreateMCPServerDto } from '../dtos';
import { MCPServer } from './entities/mcp-server.entity';

@Controller('api/mcp-servers')
export class MCPServersController {
  /**
   * Creates a new instance of MCPServersController.
   *
   * @param mcpServersService - The service responsible for MCP server management operations
   * @param mcpRuntimeService - The service responsible for MCP server runtime lifecycle
   */
  constructor(
    private readonly mcpServersService: MCPServersService,
    private readonly mcpRuntimeService: MCPRuntimeService,
  ) {}

  /**
   * Creates a new MCP server associated with a datasource.
   * The server is initialized in draft status and requires activation before it can handle requests.
   *
   * @param createMCPServerDto - The data transfer object containing MCP server creation details
   * @returns A promise that resolves to the newly created MCPServer entity
   * @throws {NotFoundException} When the specified datasource does not exist
   */
  @Post()
  create(@Body() createMCPServerDto: CreateMCPServerDto) {
    return this.mcpServersService.create(createMCPServerDto);
  }

  /**
   * Retrieves all MCP servers from the system, optionally filtered by datasource ID.
   * Use the datasourceId query parameter to retrieve only servers for a specific datasource.
   *
   * @param datasourceId - Optional query parameter to filter MCP servers by datasource ID
   * @returns A promise that resolves to an array of MCPServer entities
   */
  @Get()
  findAll(@Query('datasourceId') datasourceId?: string) {
    return this.mcpServersService.findAll(datasourceId);
  }

  /**
   * Retrieves a specific MCP server by its unique identifier.
   *
   * @param id - The unique identifier of the MCP server to retrieve
   * @returns A promise that resolves to the MCPServer entity
   * @throws {NotFoundException} When no MCP server exists with the provided ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mcpServersService.findOne(id);
  }

  /**
   * Updates an existing MCP server with partial data.
   * Any update will reset the server status to draft, requiring reactivation.
   *
   * @param id - The unique identifier of the MCP server to update
   * @param updateData - Partial data containing the MCP server fields to update
   * @returns A promise that resolves to the updated MCPServer entity
   * @throws {NotFoundException} When no MCP server exists with the provided ID
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<MCPServer>) {
    return this.mcpServersService.update(id, updateData);
  }

  /**
   * Deletes an MCP server from the system.
   * If the server is currently active, it will be stopped before deletion.
   *
   * @param id - The unique identifier of the MCP server to delete
   * @returns A promise that resolves when the MCP server is successfully deleted
   * @throws {NotFoundException} When no MCP server exists with the provided ID
   */
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.mcpServersService.delete(id);
  }

  /**
   * Activates an MCP server, making it available to handle requests.
   * Starts the server runtime and transitions the status from draft to active.
   *
   * @param id - The unique identifier of the MCP server to activate
   * @returns A promise that resolves to the updated MCPServer entity with active status
   * @throws {NotFoundException} When no MCP server exists with the provided ID
   * @throws {BadRequestException} When the server fails to start or activate
   */
  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.mcpServersService.activate(id);
  }
}

// Separate controller for MCP protocol endpoints (Streamable HTTP transport)
@Controller('mcp')
export class MCPProtocolController {
  /** Map of session IDs to their associated server slugs */
  private readonly sessions = new Map<string, string>();

  /**
   * Creates a new instance of MCPProtocolController.
   *
   * @param mcpServersService - The service responsible for MCP server management operations
   * @param mcpRuntimeService - The service responsible for MCP server runtime lifecycle
   */
  constructor(
    private readonly mcpServersService: MCPServersService,
    private readonly mcpRuntimeService: MCPRuntimeService,
  ) {}

  /**
   * Handles incoming MCP (Model Context Protocol) JSON-RPC requests using Streamable HTTP transport.
   * Supports both single requests and batch requests.
   *
   * @param slug - The unique slug identifying the MCP server to handle the request
   * @param req - The Express request object containing the JSON-RPC request body
   * @param res - The Express response object for sending the JSON-RPC response
   * @returns A promise that resolves to the JSON-RPC response or error response
   */
  @Post(':slug')
  async handleMCPRequest(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Validate server exists and is active
      const mcpServer = await this.mcpServersService.findBySlug(slug);
      if (mcpServer.status !== 'active') {
        return res.status(400).json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: {
            code: -32000,
            message: 'Server is not active',
          },
        });
      }

      // Get the MCP server instance
      const server = this.mcpRuntimeService.getServer(slug);
      if (!server) {
        return res.status(404).json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: {
            code: -32001,
            message: 'MCP server not found',
          },
        });
      }

      // Generate or retrieve session ID
      let sessionId = req.headers['mcp-session-id'] as string;
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.sessions.set(sessionId, slug);
      }

      // Process the JSON-RPC request
      const jsonrpcRequest = req.body as any;
      const response = await this.processRequest(jsonrpcRequest, mcpServer, slug);

      // For notifications (no response needed), return 202 Accepted
      if (response === null) {
        res.setHeader('Mcp-Session-Id', sessionId);
        return res.status(202).send();
      }

      // Return JSON response with session header
      res.setHeader('Mcp-Session-Id', sessionId);
      return res.json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: errorMessage,
        },
      });
    }
  }

  /**
   * Processes a single JSON-RPC request and returns the response.
   */
  private async processRequest(
    jsonrpcRequest: any,
    mcpServer: MCPServer,
    slug: string,
  ): Promise<any> {
    const method = jsonrpcRequest.method;

    // Handle initialize
    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: jsonrpcRequest.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: mcpServer.name,
            version: '1.0.0',
          },
        },
      };
    }

    // Handle notifications (no response)
    if (method === 'notifications/initialized' || method.startsWith('notifications/')) {
      return null;
    }

    // Handle tools/list
    if (method === 'tools/list') {
      const toolsResult = await this.mcpRuntimeService.handleToolsList(slug);
      return {
        jsonrpc: '2.0',
        id: jsonrpcRequest.id,
        result: toolsResult,
      };
    }

    // Handle tools/call
    if (method === 'tools/call') {
      const toolsResult = await this.mcpRuntimeService.handleToolsCall(
        slug,
        jsonrpcRequest.params,
      );
      return {
        jsonrpc: '2.0',
        id: jsonrpcRequest.id,
        result: toolsResult,
      };
    }

    // Unknown method
    return {
      jsonrpc: '2.0',
      id: jsonrpcRequest.id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    };
  }
}
