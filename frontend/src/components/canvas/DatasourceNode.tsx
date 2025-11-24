import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, CheckCircle2, XCircle, AlertCircle, MoreVertical, Edit, Trash2, TableProperties } from 'lucide-react';
import { Datasource } from 'shared';
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

/**
 * Data structure for DatasourceNode component.
 */
interface DatasourceNodeData {
  /** The datasource entity containing connection details and status */
  datasource: Datasource;
  /** Optional callback function triggered when the node is clicked */
  onClick?: () => void;
  /** Optional callback function triggered when edit is clicked */
  onEdit?: () => void;
  /** Optional callback function triggered when delete is clicked */
  onDelete?: () => void;
  /** Optional callback function triggered when view schema is clicked */
  onViewSchema?: () => void;
  /** Whether this node has children (disables delete) */
  hasChildren?: boolean;
}

/**
 * DatasourceNode component renders a visual representation of a database datasource
 * within the React Flow canvas.
 *
 * Features:
 * - Displays datasource name, connection details (host, port, database), and type
 * - Shows connection status with color-coded borders and icons
 * - Provides connection handles for linking with other nodes
 * - Supports click interactions for editing or viewing details
 *
 * Status indicators:
 * - Green: Successfully connected
 * - Red: Connection error
 * - Yellow: Disconnected
 *
 * @param props - Node props containing datasource data
 * @returns A styled datasource node with connection handles
 */
export const DatasourceNode = memo(({ data }: NodeProps<DatasourceNodeData>) => {
  const { datasource, onEdit, onDelete, onViewSchema, hasChildren } = data;

  /**
   * Returns the appropriate status icon based on datasource connection status.
   *
   * @returns A Lucide icon component representing the current status
   */
  const getStatusIcon = () => {
    switch (datasource.status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'disconnected':
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  /**
   * Returns the appropriate border color class based on datasource connection status.
   *
   * @returns A Tailwind CSS border color class string
   */
  const getStatusColor = () => {
    switch (datasource.status) {
      case 'connected':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'disconnected':
      default:
        return 'border-yellow-500';
    }
  };

  /**
   * Returns the appropriate status light color based on datasource connection status.
   *
   * @returns A CSS color class for the status indicator
   */
  const getStatusLightColor = () => {
    switch (datasource.status) {
      case 'connected':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'disconnected':
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <>
      {/* Input handle for connections from previous nodes */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary"
        style={{ left: -6 }}
      />

      <div
        onClick={data.onClick}
        className={`px-4 py-4 rounded-lg border-2 bg-card hover:shadow-lg transition-all cursor-pointer relative ${getStatusColor()}`}
        style={{ minWidth: '200px', minHeight: '180px' }}
      >
        {/* Status Light Indicator */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-2 left-2">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusLightColor()} shadow-sm cursor-default`} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{datasource.status === 'connected' ? 'Connected' :
                  datasource.status === 'error' ? 'Error' : 'Disconnected'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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
              <DropdownMenuItem onClick={onViewSchema}>
                <TableProperties className="mr-2 h-4 w-4" />
                View Schema
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
          <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Database className="w-6 h-6 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center w-full text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="font-semibold text-sm truncate">{datasource.name}</h3>
              {getStatusIcon()}
            </div>
            <p className="text-xs text-muted-foreground truncate px-2">
              {datasource.host}:{datasource.port}/{datasource.database}
            </p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {datasource.type}
            </p>
          </div>
        </div>
      </div>

      {/* Output handle for connections to next nodes */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-primary"
        style={{ right: -6 }}
      />
    </>
  );
});

DatasourceNode.displayName = 'DatasourceNode';
