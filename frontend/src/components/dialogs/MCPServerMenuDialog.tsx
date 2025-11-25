import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { ToolDialog } from './ToolDialog';
import { Tool } from 'shared';

interface MCPServerMenuDialogProps {
  /** Controls the visibility of the dialog */
  open: boolean;
  /** Callback function to update the open state of the dialog */
  onOpenChange: (open: boolean) => void;
  /** MCP Server ID */
  mcpServerId: string;
  /** MCP Server name for display */
  mcpServerName: string;
  /** Optional callback when tool is created */
  onToolCreated?: (tool: Tool) => void;
}

/**
 * MCPServerMenuDialog displays action buttons for MCP server interactions.
 *
 * Features:
 * - "Create Tool" button opens ToolDialog
 * - Manages child dialog states
 */
export function MCPServerMenuDialog({
  open,
  onOpenChange,
  mcpServerId,
  mcpServerName,
  onToolCreated,
}: MCPServerMenuDialogProps) {
  const [toolDialogOpen, setToolDialogOpen] = useState(false);

  const handleCreateTool = () => {
    setToolDialogOpen(true);
  };

  const handleToolCreated = (tool: Tool) => {
    setToolDialogOpen(false);
    onToolCreated?.(tool);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mcpServerName}</DialogTitle>
            <DialogDescription>
              Choose an action for this MCP server
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {/* Create Tool Button */}
            <Button
              onClick={handleCreateTool}
              className="h-auto flex-col items-start gap-2 p-4"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Plus className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Create Tool</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    Generate SQL queries with AI and create new tools
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Child Dialogs */}
      <ToolDialog
        open={toolDialogOpen}
        onOpenChange={setToolDialogOpen}
        mode="create"
        mcpServerId={mcpServerId}
        onSuccess={handleToolCreated}
      />
    </>
  );
}
