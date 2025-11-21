import { CanvasNodeType } from '../enums/canvas-node-type.enum';
export interface CanvasNode {
    id: string;
    nodeId: string;
    type: CanvasNodeType;
    positionX: number;
    positionY: number;
    datasourceId: string | null;
    mcpServerId: string | null;
    toolId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=canvas-node.types.d.ts.map