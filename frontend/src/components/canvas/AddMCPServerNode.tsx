import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Data structure for AddMCPServerNode component.
 */
interface AddMCPServerNodeData {
  /** The datasource ID this add button is associated with */
  datasourceId: string;
  /** Callback function triggered when the node is clicked */
  onClick?: () => void;
}

/**
 * AddMCPServerNode component renders a small circular "+" button connected to a datasource node.
 * Similar to n8n's add node style - minimal and unobtrusive until hovered.
 *
 * @param props - Node props containing datasource ID and click handler
 * @returns A small circular add button node
 */
export const AddMCPServerNode = memo(({ data }: NodeProps<AddMCPServerNodeData>) => {
  return (
    <>
      {/* Input handle for connection from datasource */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-primary !border-0"
        style={{ left: -4 }}
      />

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={data.onClick}
              className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/40 bg-background hover:border-primary hover:bg-primary/10 transition-all cursor-pointer flex items-center justify-center group shadow-sm hover:shadow-md"
            >
              <Plus className="w-8 h-8 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add MCP Server</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
});

AddMCPServerNode.displayName = 'AddMCPServerNode';
