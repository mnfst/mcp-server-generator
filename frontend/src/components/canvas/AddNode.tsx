import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Plus } from 'lucide-react';

/**
 * Data structure for AddNode component.
 */
interface AddNodeData {
  /** The text label to display on the add button */
  label: string;
  /** Optional callback function triggered when the node is clicked */
  onClick?: () => void;
}

/**
 * AddNode component renders an interactive "add" button within the React Flow canvas.
 * Used to trigger creation of new datasources, MCP servers, or other entities.
 *
 * Features:
 * - Displays a dashed border to indicate it's an action node
 * - Shows a plus icon and customizable label
 * - Provides hover effects for better user interaction feedback
 * - Includes a connection handle for potential node relationships
 *
 * @param props - Node props containing label and click handler
 * @returns A styled add button node with visual feedback
 */
export const AddNode = memo(({ data }: NodeProps<AddNodeData>) => {
  return (
    <div
      onClick={data.onClick}
      className="px-6 py-4 rounded-lg border-2 border-dashed border-muted-foreground/50 bg-background hover:border-primary hover:bg-accent transition-colors cursor-pointer group"
      style={{ minWidth: '200px' }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
          {data.label}
        </p>
      </div>

      {/* Handle for connecting to other nodes */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-primary"
        style={{ right: -6 }}
      />
    </div>
  );
});

AddNode.displayName = 'AddNode';
