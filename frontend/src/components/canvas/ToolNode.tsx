import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Wrench, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Tool } from 'shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import './ToolNode.css';

/**
 * Data structure for ToolNode component.
 */
interface ToolNodeData {
  /** The tool entity containing SQL query and metadata */
  tool: Tool;
  /** Optional callback function triggered when the node is clicked */
  onClick?: () => void;
  /** Optional callback function triggered when edit is clicked */
  onEdit?: () => void;
  /** Optional callback function triggered when delete is clicked */
  onDelete?: () => void;
  /** Whether this node has children (disables delete) */
  hasChildren?: boolean;
}

/**
 * ToolNode component renders a visual representation of a SQL query tool
 * within the React Flow canvas.
 *
 * Features:
 * - Displays tool name and description
 * - Shows tool icon
 * - Provides connection handle for linking with MCP server nodes
 * - Supports click interactions for viewing/editing tool details (placeholder for US3)
 *
 * @param props - Node props containing tool data
 * @returns A styled tool node with connection handles
 */
export const ToolNode = memo(({ data }: NodeProps<ToolNodeData>) => {
  const { tool, onClick, onEdit, onDelete, hasChildren } = data;

  // Guard against deleted/missing tool
  if (!tool) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <>
      {/* Input Handle (connects to MCP Server) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-500 !w-3 !h-3"
        style={{ left: -6 }}
      />

      <div className="tool-node">
        <div className="tool-wrapper gradient">
          <div
            className="tool-inner"
            onClick={handleClick}
          >
            {/* 3-dots Menu */}
            <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    disabled={hasChildren}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/10">
                <Wrench className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm truncate">
                  {tool.name}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {tool.description}
            </p>

            {/* Parameters Count */}
            {tool.parameters && Object.keys(tool.parameters).length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-700">
                  {Object.keys(tool.parameters).length} param
                  {Object.keys(tool.parameters).length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
});

ToolNode.displayName = 'ToolNode';
