export interface MCPServer {
  id: string;
  name: string;
  slug: string;
  datasourceId: string;
  config: Record<string, any> | null;
  status: 'draft' | 'active' | 'error';
  mcpEndpoint: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MCPServerStatus = 'draft' | 'active' | 'error';
