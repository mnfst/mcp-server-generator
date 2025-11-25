import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreateMCPServerDto, Datasource, MCPServer } from 'shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/api';

/**
 * Props for the CreateMCPServerDialog component.
 */
interface CreateMCPServerDialogProps {
  /** Controls the visibility of the dialog */
  open: boolean;
  /** Callback function to update the open state of the dialog */
  onOpenChange: (open: boolean) => void;
  /** Optional callback function triggered when an MCP server is successfully created/updated */
  onSuccess?: () => void;
  /** Optional pre-selected datasource ID to link the MCP server to */
  datasourceId?: string;
  /** Optional MCP server to edit (enables edit mode) */
  mcpServer?: MCPServer;
}

/**
 * CreateMCPServerDialog component provides a form dialog for creating or editing MCP servers.
 *
 * Features:
 * - Form validation using react-hook-form
 * - Datasource selection from available connected datasources
 * - Auto-generation of URL-safe slug from server name
 * - Real-time error feedback
 * - Loading states for async operations
 * - Automatic form reset on close or success
 * - Support for pre-selecting a datasource via props
 * - Edit mode with pre-populated fields
 *
 * @param props - The component props
 * @returns A dialog containing the MCP server creation/edit form
 */
export function CreateMCPServerDialog({
  open,
  onOpenChange,
  onSuccess,
  datasourceId,
  mcpServer,
}: CreateMCPServerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasources, setDatasources] = useState<Datasource[]>([]);
  const [loadingDatasources, setLoadingDatasources] = useState(true);

  const isEditMode = !!mcpServer;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateMCPServerDto>({
    defaultValues: {
      datasourceId: datasourceId || '',
    },
  });

  const selectedDatasourceId = watch('datasourceId');
  const nameValue = watch('name');

  // Populate form when editing
  useEffect(() => {
    if (mcpServer && open) {
      setValue('name', mcpServer.name);
      setValue('slug', mcpServer.slug);
      setValue('datasourceId', mcpServer.datasourceId);
    }
  }, [mcpServer, open, setValue]);

  // Auto-generate slug from name (only in create mode)
  useEffect(() => {
    if (nameValue && !isEditMode) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [nameValue, setValue, isEditMode]);

  // Load datasources
  useEffect(() => {
    if (open) {
      const fetchDatasources = async () => {
        try {
          const response = await fetch(apiUrl('/api/datasources'));
          if (!response.ok) throw new Error('Failed to fetch datasources');
          const data = await response.json();
          setDatasources(data);

          // Set datasourceId if provided via props (only in create mode)
          if (!isEditMode && datasourceId && !selectedDatasourceId) {
            setValue('datasourceId', datasourceId);
          }
        } catch (err) {
          console.error('Error fetching datasources:', err);
        } finally {
          setLoadingDatasources(false);
        }
      };

      fetchDatasources();
    }
  }, [open, datasourceId, selectedDatasourceId, setValue, isEditMode]);

  /**
   * Handles form submission to create or update an MCP server.
   *
   * @param data - The validated form data containing MCP server configuration
   */
  const onSubmit = async (data: CreateMCPServerDto) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditMode
        ? apiUrl(`/api/mcp-servers/${mcpServer.id}`)
        : apiUrl('/api/mcp-servers');
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} MCP server`);
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} MCP server`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles dialog close event.
   * Resets form state and errors to initial values.
   */
  const handleClose = () => {
    reset();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Create'} MCP Server</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your MCP server settings.'
              : 'Generate a new MCP server from a connected datasource.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Datasource Selection */}
            <div className="grid gap-2">
              <Label htmlFor="datasourceId">Datasource</Label>
              {loadingDatasources ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading datasources...
                </div>
              ) : datasources.length === 0 ? (
                <p className="text-sm text-red-500">
                  No datasources available. Please create a datasource first.
                </p>
              ) : (
                <Select
                  value={selectedDatasourceId}
                  onValueChange={(value) => setValue('datasourceId', value)}
                  disabled={isEditMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a datasource" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasources
                      .filter((ds) => ds.status === 'connected' || ds.id === mcpServer?.datasourceId)
                      .map((ds) => (
                        <SelectItem key={ds.id} value={ds.id}>
                          {ds.name} ({ds.host}:{ds.port}/{ds.database})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Datasource cannot be changed after creation.
                </p>
              )}
              {errors.datasourceId && (
                <p className="text-sm text-red-500">{errors.datasourceId.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Server Name</Label>
              <Input
                id="name"
                placeholder="My MCP Server"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Slug (auto-generated in create mode, editable in edit mode) */}
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="my-mcp-server"
                {...register('slug', {
                  required: 'Slug is required',
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
                  },
                })}
              />
              <p className="text-xs text-muted-foreground">
                {isEditMode
                  ? 'Warning: Changing the slug will change the MCP endpoint URL.'
                  : 'Auto-generated from name. Used in MCP endpoint URL: /mcp/your-slug'}
              </p>
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
            </div>

            {/* Error Message */}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || datasources.length === 0 || !selectedDatasourceId}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Create Server'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
