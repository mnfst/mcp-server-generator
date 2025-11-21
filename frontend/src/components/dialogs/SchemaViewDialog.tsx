import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SchemaListView } from '@/components/schema/SchemaListView';
import { useSchema, useRefreshSchema } from '@/services/api';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface SchemaViewDialogProps {
  /** Controls the visibility of the dialog */
  open: boolean;
  /** Callback function to update the open state of the dialog */
  onOpenChange: (open: boolean) => void;
  /** Datasource ID to fetch schema for */
  datasourceId: string;
  /** Datasource name for display */
  datasourceName?: string;
  /** Optional set of table/column names to highlight */
  highlighting?: Set<string>;
}

/**
 * SchemaViewDialog displays database schema in a dialog.
 *
 * Features:
 * - Fetches and displays schema via GET /api/schema/:datasourceId
 * - Refresh button to reload schema via POST /api/schema/:datasourceId/refresh
 * - Loading and error states
 * - Search and filter functionality via SchemaListView
 */
export function SchemaViewDialog({
  open,
  onOpenChange,
  datasourceId,
  datasourceName,
  highlighting,
}: SchemaViewDialogProps) {
  const { data: schema, isLoading, error } = useSchema(datasourceId);
  const refreshSchema = useRefreshSchema();

  const handleRefresh = async () => {
    try {
      await refreshSchema.mutateAsync(datasourceId);
    } catch (err) {
      console.error('Failed to refresh schema:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Database Schema</DialogTitle>
              <DialogDescription>
                {datasourceName || 'View database tables and columns'}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshSchema.isPending || isLoading}
            >
              {refreshSchema.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="font-semibold text-destructive">
                  Failed to load schema
                </p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
              </div>
              <Button variant="outline" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          ) : schema ? (
            <SchemaListView schema={schema} highlighting={highlighting} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
