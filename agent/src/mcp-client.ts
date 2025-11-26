/**
 * MCP Client Manager - connects to HTTP MCP servers and aggregates tools/resources.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { McpServerConfig, McpServersConfig, ToolDefinition, McpResource, ToolExecutionResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ConnectedServer {
  name: string;
  client: Client;
  tools: ToolDefinition[];
  resources: McpResource[];
  toolNameMap: Map<string, string>; // sanitized name -> original name
}

class McpClientManager {
  private servers: ConnectedServer[] = [];
  private initialized = false;
  private globalToolNameMap: Map<string, string> = new Map(); // sanitized -> original

  /**
   * Load server config and connect to all enabled MCP servers.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const configPath = join(__dirname, '..', 'mcp-servers.json');
    let config: McpServersConfig;

    try {
      const configContent = readFileSync(configPath, 'utf-8');
      config = JSON.parse(configContent) as McpServersConfig;
    } catch (error) {
      console.log('[MCP] No mcp-servers.json found or invalid, starting without MCP servers');
      this.initialized = true;
      return;
    }

    const enabledServers = config.servers.filter(s => s.enabled);
    console.log(`[MCP] Found ${enabledServers.length} enabled server(s)`);

    for (const serverConfig of enabledServers) {
      await this.connectToServer(serverConfig);
    }

    this.initialized = true;
  }

  /**
   * Connect to a single MCP server.
   */
  private async connectToServer(serverConfig: McpServerConfig): Promise<void> {
    console.log(`[MCP] Connecting to ${serverConfig.name} at ${serverConfig.url}...`);

    try {
      const transport = new StreamableHTTPClientTransport(new URL(serverConfig.url));
      const client = new Client(
        { name: 'mcp-chat-agent', version: '1.0.0' },
        { capabilities: {} }
      );

      await client.connect(transport);
      console.log(`[MCP] Connected to ${serverConfig.name}`);

      // Discover tools and build name mapping
      const toolsResponse = await client.listTools();
      const mcpTools = toolsResponse.tools || [];
      const toolNameMap = new Map<string, string>();

      const tools = mcpTools.map(tool => {
        const sanitizedName = this.sanitizeToolName(tool.name);
        toolNameMap.set(sanitizedName, tool.name);
        this.globalToolNameMap.set(sanitizedName, tool.name);
        return {
          type: 'function' as const,
          function: {
            name: sanitizedName,
            description: tool.description || '',
            parameters: (tool.inputSchema || { type: 'object', properties: {} }) as Record<string, unknown>,
          },
        };
      });
      console.log(`[MCP] Found ${tools.length} tool(s) from ${serverConfig.name}`);

      // Discover resources
      let resources: McpResource[] = [];
      try {
        const resourcesResponse = await client.listResources();
        resources = (resourcesResponse.resources || []).map(r => ({
          uri: r.uri,
          name: r.name,
          description: r.description,
          mimeType: r.mimeType,
        }));
        console.log(`[MCP] Found ${resources.length} resource(s) from ${serverConfig.name}`);
      } catch {
        console.log(`[MCP] Server ${serverConfig.name} does not expose resources`);
      }

      this.servers.push({
        name: serverConfig.name,
        client,
        tools,
        resources,
        toolNameMap,
      });
    } catch (error) {
      console.error(`[MCP] Failed to connect to ${serverConfig.name}:`, error);
    }
  }

  /**
   * Sanitize tool name to match OpenAI's pattern: ^[a-zA-Z0-9_-]+$
   */
  private sanitizeToolName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Convert MCP tools to OpenAI function format.
   */
  private convertMcpToolsToOpenAI(mcpTools: Array<{ name: string; description?: string; inputSchema?: unknown }>): ToolDefinition[] {
    return mcpTools.map(tool => ({
      type: 'function' as const,
      function: {
        name: this.sanitizeToolName(tool.name),
        description: tool.description || '',
        parameters: (tool.inputSchema || { type: 'object', properties: {} }) as Record<string, unknown>,
      },
    }));
  }

  /**
   * Get all tools from all connected servers.
   */
  getAllTools(): ToolDefinition[] {
    return this.servers.flatMap(s => s.tools);
  }

  /**
   * Get all resources from all connected servers.
   */
  getAllResources(): McpResource[] {
    return this.servers.flatMap(s => s.resources);
  }

  /**
   * Execute a tool by name with given arguments.
   * toolName is the sanitized name from OpenAI - we map it back to the original MCP name.
   */
  async callTool(toolName: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    // Map sanitized name back to original MCP name
    const originalName = this.globalToolNameMap.get(toolName) || toolName;
    console.log(`[MCP] Calling tool: ${toolName} (original: ${originalName}) with args:`, JSON.stringify(args));

    for (const server of this.servers) {
      const hasTool = server.tools.some(t => t.function.name === toolName);
      if (hasTool) {
        try {
          const result = await server.client.callTool({ name: originalName, arguments: args });
          const content = Array.isArray(result.content)
            ? result.content.map(c => ('text' in c ? c.text : JSON.stringify(c))).join('\n')
            : JSON.stringify(result.content);

          console.log(`[MCP] Tool ${toolName} result:`, content.substring(0, 200));

          return {
            success: true,
            content,
            isError: Boolean(result.isError),
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[MCP] Tool ${toolName} failed:`, errorMsg);
          return {
            success: false,
            content: `Tool execution failed: ${errorMsg}`,
            isError: true,
          };
        }
      }
    }

    return {
      success: false,
      content: `Tool '${toolName}' not found in any connected MCP server`,
      isError: true,
    };
  }

  /**
   * Read a resource by URI.
   */
  async readResource(uri: string): Promise<ToolExecutionResult> {
    console.log(`[MCP] Reading resource: ${uri}`);

    for (const server of this.servers) {
      const hasResource = server.resources.some(r => r.uri === uri);
      if (hasResource) {
        try {
          const result = await server.client.readResource({ uri });
          const content = Array.isArray(result.contents)
            ? result.contents.map(c => ('text' in c ? c.text : JSON.stringify(c))).join('\n')
            : JSON.stringify(result.contents);

          console.log(`[MCP] Resource ${uri} content:`, content.substring(0, 200));

          return {
            success: true,
            content,
            isError: false,
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[MCP] Resource ${uri} read failed:`, errorMsg);
          return {
            success: false,
            content: `Resource read failed: ${errorMsg}`,
            isError: true,
          };
        }
      }
    }

    return {
      success: false,
      content: `Resource '${uri}' not found in any connected MCP server`,
      isError: true,
    };
  }

  /**
   * Get formatted description of all tools for system prompt.
   */
  getToolsDescription(): string {
    const tools = this.getAllTools();
    if (tools.length === 0) return 'No tools available.';

    return tools
      .map(t => `- ${t.function.name}: ${t.function.description}`)
      .join('\n');
  }

  /**
   * Get formatted description of all resources for system prompt.
   */
  getResourcesDescription(): string {
    const resources = this.getAllResources();
    if (resources.length === 0) return 'No resources available.';

    return resources
      .map(r => `- ${r.name} (${r.uri}): ${r.description || 'No description'}`)
      .join('\n');
  }

  /**
   * Check if any MCP servers are connected.
   */
  hasConnections(): boolean {
    return this.servers.length > 0;
  }
}

// Singleton instance
export const mcpClient = new McpClientManager();
