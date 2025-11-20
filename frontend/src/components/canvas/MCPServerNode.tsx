import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Server, CheckCircle2, FileEdit, AlertCircle } from 'lucide-react';
import { MCPServer } from 'shared';

/**
 * Data structure for MCPServerNode component.
 */
interface MCPServerNodeData {
  /** The MCP server entity containing configuration and status information */
  mcpServer: MCPServer;
  /** Optional callback function triggered when the node is clicked */
  onClick?: () => void;
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
  const { mcpServer } = data;

  /**
   * Returns the appropriate status icon based on MCP server activation status.
   *
   * @returns A Lucide icon component representing the current status
   */
  const getStatusIcon = () => {
    switch (mcpServer.status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'draft':
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
      case 'active':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'draft':
      default:
        return 'border-yellow-500';
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

      <div
        onClick={data.onClick}
        className={`px-4 py-3 rounded-lg border-2 bg-card hover:shadow-lg transition-all cursor-pointer ${getStatusColor()}`}
        style={{ minWidth: '220px' }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Server className="w-5 h-5 text-blue-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{mcpServer.name}</h3>
              {getStatusIcon()}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              /{mcpServer.slug}
            </p>
            {mcpServer.status === 'active' && (
              <p className="text-xs text-blue-500 mt-1 truncate font-mono">
                {getEndpointUrl()}
              </p>
            )}
            {mcpServer.status === 'draft' && (
              <p className="text-xs text-muted-foreground mt-1">
                Not yet activated
              </p>
            )}
          </div>
        </div>
      </div>

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
