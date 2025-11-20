import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Datasource } from 'shared';

/**
 * Data structure for DatasourceNode component.
 */
interface DatasourceNodeData {
  /** The datasource entity containing connection details and status */
  datasource: Datasource;
  /** Optional callback function triggered when the node is clicked */
  onClick?: () => void;
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
  const { datasource } = data;

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
        className={`px-4 py-3 rounded-lg border-2 bg-card hover:shadow-lg transition-all cursor-pointer ${getStatusColor()}`}
        style={{ minWidth: '220px' }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{datasource.name}</h3>
              {getStatusIcon()}
            </div>
            <p className="text-xs text-muted-foreground truncate">
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
