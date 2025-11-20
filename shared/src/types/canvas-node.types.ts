export interface CanvasNode {
  id: string;
  nodeId: string;
  type: 'datasource' | 'mcpServer' | 'tool' | 'add';
  positionX: number;
  positionY: number;
  datasourceId: string | null;
  mcpServerId: string | null;
  toolId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CanvasNodeType = 'datasource' | 'mcpServer' | 'tool' | 'add';
