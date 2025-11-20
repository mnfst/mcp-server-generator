import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreateMCPServerDto, Datasource } from 'shared';
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
  /** Optional callback function triggered when an MCP server is successfully created */
  onSuccess?: () => void;
  /** Optional pre-selected datasource ID to link the MCP server to */
  datasourceId?: string;
}

/**
 * CreateMCPServerDialog component provides a form dialog for creating new MCP (Model Context Protocol) servers.
 *
 * Features:
 * - Form validation using react-hook-form
 * - Datasource selection from available connected datasources
 * - Auto-generation of URL-safe slug from server name
 * - Real-time error feedback
 * - Loading states for async operations
 * - Automatic form reset on close or success
 * - Support for pre-selecting a datasource via props
 *
 * Required fields:
 * - Datasource: Connected datasource to generate the MCP server from
 * - Name: Display name for the MCP server
 * - Slug: URL-safe identifier (auto-generated from name)
 * - Version: Server version (default: 1.0.0)
 *
 * @param props - The component props
 * @returns A dialog containing the MCP server creation form
 */
export function CreateMCPServerDialog({
  open,
  onOpenChange,
  onSuccess,
  datasourceId,
}: CreateMCPServerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasources, setDatasources] = useState<Datasource[]>([]);
  const [loadingDatasources, setLoadingDatasources] = useState(true);

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

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [nameValue, setValue]);

  // Load datasources
  useEffect(() => {
    if (open) {
      const fetchDatasources = async () => {
        try {
          const response = await fetch(apiUrl('/api/datasources'));
          if (!response.ok) throw new Error('Failed to fetch datasources');
          const data = await response.json();
          setDatasources(data);

          // Set datasourceId if provided via props
          if (datasourceId && !selectedDatasourceId) {
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
  }, [open, datasourceId, selectedDatasourceId, setValue]);

  /**
   * Handles form submission to create a new MCP server.
   * Validates that a datasource is selected before submitting.
   *
   * @param data - The validated form data containing MCP server configuration
   */
  const onSubmit = async (data: CreateMCPServerDto) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/mcp-servers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create MCP server');
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create MCP server');
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
          <DialogTitle>Create MCP Server</DialogTitle>
          <DialogDescription>
            Generate a new MCP server from a connected datasource.
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a datasource" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasources
                      .filter((ds) => ds.status === 'connected')
                      .map((ds) => (
                        <SelectItem key={ds.id} value={ds.id}>
                          {ds.name} ({ds.host}:{ds.port}/{ds.database})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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

            {/* Slug (auto-generated) */}
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
                Auto-generated from name. Used in MCP endpoint URL: /mcp/your-slug
              </p>
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
            </div>

            {/* Version */}
            <div className="grid gap-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="1.0.0"
                defaultValue="1.0.0"
                {...register('version')}
              />
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
              Create Server
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
