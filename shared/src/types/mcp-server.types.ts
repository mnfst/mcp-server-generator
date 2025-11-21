import { MCPServerStatus } from '../enums/mcp-server-status.enum';

export { MCPServerStatus };

export interface MCPServer {
  id: string;
  name: string;
  slug: string;
  datasourceId: string;
  config: Record<string, any> | null;
  status: MCPServerStatus;
  mcpEndpoint: string;
  createdAt: Date;
  updatedAt: Date;
}
