import { Injectable, Logger } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

@Injectable()
export class MCPRuntimeService {
  private readonly logger = new Logger(MCPRuntimeService.name);
  private readonly servers = new Map<string, any>();

  async startServer(slug: string, config: { name: string; version: string }): Promise<void> {
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

      // Note: MCP SDK tools/list handler will be properly configured in User Story 2
      // For now, we just store the server instance
      this.servers.set(slug, server);
      this.logger.log(`MCP server started for slug: ${slug}`);
    } catch (error) {
      this.logger.error(`Failed to start MCP server for slug ${slug}:`, error);
      throw error;
    }
  }

  async stopServer(slug: string): Promise<void> {
    const server = this.servers.get(slug);
    if (server) {
      await server.close();
      this.servers.delete(slug);
      this.logger.log(`MCP server stopped for slug: ${slug}`);
    }
  }

  async reloadAllServers(serverConfigs: Array<{ slug: string; config: any }>): Promise<void> {
    this.logger.log('Reloading all MCP servers on backend startup...');
    for (const { slug, config } of serverConfigs) {
      try {
        await this.startServer(slug, config);
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
