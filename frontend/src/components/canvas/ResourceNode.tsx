import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText, MoreVertical, Trash2, Download } from 'lucide-react';
import { Resource } from 'shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import './ResourceNode.css';

/**
 * Data structure for ResourceNode component.
 */
interface ResourceNodeData {
  /** The resource entity containing file metadata */
  resource: Resource;
  /** Optional callback function triggered when the node is clicked */
  onClick?: () => void;
  /** Optional callback function triggered when delete is clicked */
  onDelete?: () => void;
}

/**
 * ResourceNode component renders a visual representation of a file resource
 * within the React Flow canvas.
 *
 * Features:
 * - Displays resource name and description
 * - Shows file icon with size/type info
 * - Provides connection handle for linking with MCP server nodes
 * - Supports download and delete actions
 *
 * @param props - Node props containing resource data
 * @returns A styled resource node with connection handles
 */
export const ResourceNode = memo(({ data }: NodeProps<ResourceNodeData>) => {
  const { resource, onClick, onDelete } = data;

  // Guard against deleted/missing resource
  if (!resource) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/resources/${resource.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <>
      {/* Input Handle (connects to MCP Server) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-yellow-500 !w-3 !h-3"
        style={{ left: -6 }}
      />

      <div className="resource-node">
        <div className="resource-wrapper gradient">
          <div
            className="resource-inner"
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
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
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
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500/10">
                <FileText className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm truncate">
                  {resource.name}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {resource.description}
            </p>

            {/* File Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-yellow-700">
                {formatFileSize(resource.size)}
              </span>
              <span className="truncate text-muted-foreground/70">
                {resource.originalFilename}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

ResourceNode.displayName = 'ResourceNode';
