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
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, Subject } from 'rxjs';
import { MCPServersService } from './mcp-servers.service';
import { MCPRuntimeService } from './mcp-runtime.service';
import { CreateMCPServerDto } from '../dtos';
import { MCPServer } from './entities/mcp-server.entity';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

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

// Separate controller for MCP protocol endpoints
@Controller('mcp')
export class MCPProtocolController {
  /** Map of SSE message subjects for each server slug */
  private readonly sseStreams = new Map<string, Subject<MessageEvent>>();

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
   * SSE endpoint for receiving server-to-client messages (streaming support).
   * MCP Inspector connects here with GET + Accept: text/event-stream
   *
   * @param slug - The unique slug identifying the MCP server
   * @returns Observable stream of Server-Sent Events
   */
  @Sse(':slug/sse')
  async handleSSE(@Param('slug') slug: string): Promise<Observable<MessageEvent>> {
    try {
      // Validate server exists and is active
      const mcpServer = await this.mcpServersService.findBySlug(slug);
      if (mcpServer.status !== 'active') {
        throw new Error('Server is not active');
      }

      // Create or get existing SSE stream for this server
      if (!this.sseStreams.has(slug)) {
        this.sseStreams.set(slug, new Subject<MessageEvent>());
      }

      const stream = this.sseStreams.get(slug)!;

      // Return an Observable that sends a connection event immediately
      return new Observable<MessageEvent>((observer) => {
        // Send MCP endpoint message (required for SSE transport)
        observer.next({
          data: JSON.stringify({
            jsonrpc: '2.0',
            method: 'endpoint',
            params: {
              endpoint: `http://localhost:3001/mcp/${slug}`
            }
          }),
        } as MessageEvent);

        // Subscribe to the main stream for actual messages
        const subscription = stream.subscribe({
          next: (event) => observer.next(event),
          error: (err) => observer.error(err),
          complete: () => observer.complete(),
        });

        // Send keep-alive comments every 15 seconds to keep connection open
        const keepAliveInterval = setInterval(() => {
          observer.next({
            data: '',  // Empty data for keep-alive
            type: 'ping',
          } as MessageEvent);
        }, 15000);

        // Cleanup on unsubscribe
        return () => {
          subscription.unsubscribe();
          clearInterval(keepAliveInterval);
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorSubject = new Subject<MessageEvent>();
      errorSubject.next({
        data: JSON.stringify({ error: errorMessage }),
      } as MessageEvent);
      errorSubject.complete();
      return errorSubject.asObservable();
    }
  }

  /**
   * Handles incoming MCP (Model Context Protocol) JSON-RPC requests for a specific server.
   * Processes the request through the MCP SDK server and sends response via SSE if streaming is active.
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

      // Process the JSON-RPC request manually
      const jsonrpcRequest = req.body as any;
      let response: any;

      // Route the request based on method
      if (jsonrpcRequest.method === 'tools/list') {
        const toolsResult = await this.mcpRuntimeService.handleToolsList(slug);
        response = {
          jsonrpc: '2.0',
          id: jsonrpcRequest.id,
          result: toolsResult,
        };
      } else if (jsonrpcRequest.method === 'tools/call') {
        const toolsResult = await this.mcpRuntimeService.handleToolsCall(slug, jsonrpcRequest.params);
        response = {
          jsonrpc: '2.0',
          id: jsonrpcRequest.id,
          result: toolsResult,
        };
      } else {
        response = {
          jsonrpc: '2.0',
          id: jsonrpcRequest.id,
          error: {
            code: -32601,
            message: `Method not found: ${jsonrpcRequest.method}`,
          },
        };
      }

      // If SSE stream exists, also send via SSE for streaming clients
      const sseStream = this.sseStreams.get(slug);
      if (sseStream) {
        sseStream.next({
          data: JSON.stringify(response),
        } as MessageEvent);
      }

      // Always return HTTP response for non-streaming clients
      return res.json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse = {
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: errorMessage,
        },
      };

      // Send error via SSE if stream exists
      const sseStream = this.sseStreams.get(slug);
      if (sseStream) {
        sseStream.next({
          data: JSON.stringify(errorResponse),
        } as MessageEvent);
      }

      return res.status(500).json(errorResponse);
    }
  }
}
