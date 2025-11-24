import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Server, CheckCircle2, FileEdit, AlertCircle, MoreVertical, Edit, Trash2, Cable } from 'lucide-react';
import { MCPServer, MCPServerStatus } from 'shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MCPConnectionDialog } from '../dialogs/MCPConnectionDialog';
import './MCPServerNode.css';

/**
 * Data structure for MCPServerNode component.
 */
interface MCPServerNodeData {
  /** The MCP server entity containing configuration and status information */
  mcpServer: MCPServer;
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
 * MCPServerNode component renders a visual representation of an MCP (Model Context Protocol)
 * server within the React Flow canvas.
 *
 * Features:
 * - Displays MCP server name, slug, and endpoint URL
 * - Shows activation status with color-coded borders and icons
 * - Provides connection handles for linking with datasource nodes
 * - Supports click interactions for editing or viewing details
 *
 * Status indicators:
 * - Green: Server is active and operational
 * - Red: Server encountered an error
 * - Yellow: Server is in draft mode (not yet activated)
 *
 * @param props - Node props containing MCP server data
 * @returns A styled MCP server node with connection handles
 */
export const MCPServerNode = memo(({ data }: NodeProps<MCPServerNodeData>) => {
  const { mcpServer, onEdit, onDelete, hasChildren } = data;
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);

  /**
   * Returns the appropriate status icon based on MCP server activation status.
   *
   * @returns A Lucide icon component representing the current status
   */
  const getStatusIcon = () => {
    switch (mcpServer.status) {
      case MCPServerStatus.ACTIVE:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case MCPServerStatus.ERROR:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case MCPServerStatus.DRAFT:
      default:
        return <FileEdit className="w-4 h-4 text-yellow-500" />;
    }
  };

  /**
   * Returns the appropriate border color class based on MCP server status.
   *
   * @returns A Tailwind CSS border color class string
   */
  const getStatusColor = () => {
    switch (mcpServer.status) {
      case MCPServerStatus.ACTIVE:
        return 'border-green-500';
      case MCPServerStatus.ERROR:
        return 'border-red-500';
      case MCPServerStatus.DRAFT:
      default:
        return 'border-yellow-500';
    }
  };

  /**
   * Returns the appropriate status light color based on MCP server status.
   *
   * @returns A CSS color class for the status indicator
   */
  const getStatusLightColor = () => {
    switch (mcpServer.status) {
      case MCPServerStatus.ACTIVE:
        return 'bg-green-500';
      case MCPServerStatus.ERROR:
        return 'bg-red-500';
      case MCPServerStatus.DRAFT:
      default:
        return 'bg-gray-400';
    }
  };

  /**
   * Constructs the MCP endpoint URL for the server.
   * Uses custom endpoint if configured, otherwise generates from slug.
   *
   * @returns The MCP endpoint URL string
   */
  const getEndpointUrl = () => {
    if (mcpServer.mcpEndpoint) {
      return mcpServer.mcpEndpoint;
    }
    return `/mcp/${mcpServer.slug}`;
  };

  return (
    <>
      {/* Input handle for connections from datasource nodes */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary"
        style={{ left: -6 }}
      />

      <div className="mcp-server-node">
        <div className="mcp-wrapper gradient">
          <div
            onClick={data.onClick}
            className="mcp-inner"
          >
            {/* Status Light Indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute top-2 left-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusLightColor()} shadow-sm cursor-help`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{mcpServer.status === MCPServerStatus.ACTIVE ? 'Active' :
                      mcpServer.status === MCPServerStatus.ERROR ? 'Error' : 'Draft'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
              {/* Connect Button */}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setConnectionDialogOpen(true)}
                title="Connection Instructions"
              >
                <Cable className="h-4 w-4" />
              </Button>

              {/* 3-dots Menu */}
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

            <div className="flex flex-col items-center gap-3 h-full">
              {/* Icon */}
              <div className="w-12 h-12 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Server className="w-6 h-6 text-blue-500" />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-center w-full text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="font-semibold text-sm truncate">{mcpServer.name}</h3>
                  {getStatusIcon()}
                </div>
                <p className="text-xs text-muted-foreground truncate px-2">
                  /{mcpServer.slug}
                </p>
                {mcpServer.status === MCPServerStatus.ACTIVE && (
                  <p className="text-xs text-blue-500 mt-1 truncate font-mono px-2">
                    {getEndpointUrl()}
                  </p>
                )}
                {mcpServer.status === MCPServerStatus.DRAFT && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Not yet activated
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Instructions Dialog */}
      <MCPConnectionDialog
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
        mcpServer={mcpServer}
      />

      {/* Output handle for connections to tool nodes (future) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-primary"
        style={{ right: -6 }}
      />
    </>
  );
});

MCPServerNode.displayName = 'MCPServerNode';
