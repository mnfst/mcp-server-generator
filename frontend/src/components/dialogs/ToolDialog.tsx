import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateTool,
  useUpdateTool,
  useTestTool,
  useDeleteTool,
  useDeleteCanvasNode,
} from '@/services/api';
import { Loader2, Sparkles, Play, Save, Plus, Trash2, Edit } from 'lucide-react';
import { Tool, ToolTestResult } from 'shared';

interface ToolDialogProps {
  /** Controls the visibility of the dialog */
  open: boolean;
  /** Callback function to update the open state of the dialog */
  onOpenChange: (open: boolean) => void;
  /** Mode: create new tool or edit existing tool */
  mode: 'create' | 'edit';
  /** MCP Server ID (required for create mode) */
  mcpServerId?: string;
  /** Tool to edit (required for edit mode) */
  tool?: Tool;
  /** Optional callback when tool is successfully created */
  onSuccess?: (tool: Tool) => void;
  /** Optional callback when tool is deleted */
  onDelete?: (toolId: string) => void;
}

interface ToolFormData {
  name: string;
  description: string;
  prompt: string;
}

/**
 * ToolDialog provides interface for creating and editing SQL query tools with AI assistance.
 *
 * Features:
 * - Create mode: Natural language prompt → AI SQL generation
 * - Edit mode: View and modify existing tools
 * - Edit Prompt: Regenerate SQL from modified prompt
 * - Test execution with parameter input
 * - Delete with confirmation
 */
export function ToolDialog({
  open,
  onOpenChange,
  mode,
  mcpServerId,
  tool,
  onSuccess,
  onDelete,
}: ToolDialogProps) {
  const [currentTool, setCurrentTool] = useState<Tool | null>(tool || null);
  const [testResults, setTestResults] = useState<ToolTestResult | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [parameterValues, setParameterValues] = useState<Record<string, any>>({});

  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const testTool = useTestTool();
  const deleteTool = useDeleteTool();
  const deleteCanvasNode = useDeleteCanvasNode();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ToolFormData>({
    defaultValues:
      mode === 'edit' && tool
        ? {
            name: tool.name,
            description: tool.description,
            prompt: tool.prompt,
          }
        : undefined,
  });

  const prompt = watch('prompt');

  // Update form when tool changes (edit mode)
  useEffect(() => {
    if (mode === 'edit' && tool) {
      setValue('name', tool.name);
      setValue('description', tool.description);
      setValue('prompt', tool.prompt);
      setCurrentTool(tool);
    }
  }, [tool, mode, setValue]);

  /**
   * Generate SQL from natural language prompt (create mode)
   */
  const onGenerateSQL = handleSubmit(async (data) => {
    if (mode === 'create' && mcpServerId) {
      try {
        const newTool = await createTool.mutateAsync({
          mcpServerId,
          name: data.name,
          description: data.description,
          prompt: data.prompt,
        });
        setCurrentTool(newTool);
        setTestResults(null);
      } catch (err) {
        console.error('Failed to create tool:', err);
      }
    }
  });

  /**
   * Edit prompt and regenerate SQL (edit mode)
   */
  const onEditPrompt = handleSubmit(async (data) => {
    if (mode === 'edit' && currentTool) {
      try {
        const updatedTool = await updateTool.mutateAsync({
          id: currentTool.id,
          data: {
            prompt: data.prompt,
          },
        });
        setCurrentTool(updatedTool);
        setTestResults(null);
      } catch (err) {
        console.error('Failed to update tool:', err);
      }
    }
  });

  /**
   * Test the SQL query with parameters
   */
  const onTestTool = async () => {
    if (!currentTool) return;

    try {
      const result = await testTool.mutateAsync({
        id: currentTool.id,
        parameters: parameterValues,
      });
      setTestResults(result);
    } catch (err) {
      console.error('Failed to test tool:', err);
    }
  };

  /**
   * Save tool (only in create mode after generation)
   */
  const onSaveTool = () => {
    if (currentTool) {
      onSuccess?.(currentTool);
      handleClose();
    }
  };

  /**
   * Delete tool with canvas node cleanup
   */
  const onDeleteTool = async () => {
    if (!currentTool) return;

    try {
      // Delete the tool
      await deleteTool.mutateAsync(currentTool.id);

      // Delete the canvas node
      const nodeId = `tool-${currentTool.id}`;
      await deleteCanvasNode.mutateAsync(nodeId);

      onDelete?.(currentTool.id);
      handleClose();
    } catch (err) {
      console.error('Failed to delete tool:', err);
    }
  };

  /**
   * Reset form for creating another tool
   */
  const onCreateAnother = () => {
    reset();
    setCurrentTool(null);
    setTestResults(null);
    setParameterValues({});
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    reset();
    setCurrentTool(null);
    setTestResults(null);
    setParameterValues({});
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isCreateMode ? 'Create Tool with AI' : 'Tool Details'}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? 'Describe your query in natural language and let AI generate the SQL'
              : `Created ${new Date(currentTool?.createdAt || '').toLocaleDateString()}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Tool Name and Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Tool Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., get_user_orders"
                {...register('name', {
                  required: 'Tool name is required',
                  minLength: {
                    value: 3,
                    message: 'Name must be at least 3 characters',
                  },
                })}
                disabled={isEditMode || createTool.isPending || updateTool.isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="description"
                placeholder="Brief description of what this tool does"
                {...register('description', {
                  required: 'Description is required',
                  minLength: {
                    value: 10,
                    message: 'Description must be at least 10 characters',
                  },
                })}
                disabled={isEditMode || createTool.isPending || updateTool.isPending}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Natural Language Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">
              Natural Language Prompt <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="prompt"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe your query in plain English, e.g., 'Get all orders for a user by their email address, showing order date, total amount, and status'"
              {...register('prompt', {
                required: 'Prompt is required',
                minLength: {
                  value: 10,
                  message: 'Prompt must be at least 10 characters',
                },
              })}
              disabled={createTool.isPending || updateTool.isPending}
            />
            {errors.prompt && (
              <p className="text-sm text-destructive">{errors.prompt.message}</p>
            )}
          </div>

          {/* Generate/Edit SQL Button */}
          {!currentTool && isCreateMode && (
            <Button
              onClick={onGenerateSQL}
              disabled={createTool.isPending || !prompt}
              className="w-full"
            >
              {createTool.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating SQL...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate SQL with AI
                </>
              )}
            </Button>
          )}

          {isEditMode && currentTool && (
            <Button
              onClick={onEditPrompt}
              disabled={updateTool.isPending}
              variant="outline"
              className="w-full"
            >
              {updateTool.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating SQL...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Prompt & Regenerate SQL
                </>
              )}
            </Button>
          )}

          {/* Generated SQL Display */}
          {currentTool && (
            <div className="space-y-4 rounded-lg border bg-slate-50 p-4">
              <div>
                <Label className="text-sm font-semibold">Generated SQL Query</Label>
                <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-4 text-sm text-slate-50">
                  <code>{currentTool.sqlQuery}</code>
                </pre>
              </div>

              {/* Parameters */}
              {currentTool.parameters && Object.keys(currentTool.parameters).length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Parameters</Label>
                  <div className="mt-2 space-y-3">
                    {Object.entries(currentTool.parameters).map(([name, param]) => (
                      <div key={name} className="space-y-1">
                        <Label htmlFor={`param-${name}`} className="text-sm">
                          {name} ({param.type})
                          {param.required && (
                            <span className="ml-1 text-destructive">*</span>
                          )}
                        </Label>
                        <Input
                          id={`param-${name}`}
                          type={param.type === 'number' ? 'number' : 'text'}
                          placeholder={param.description}
                          value={parameterValues[name] || ''}
                          onChange={(e) =>
                            setParameterValues((prev) => ({
                              ...prev,
                              [name]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Button */}
              <Button
                variant="outline"
                onClick={onTestTool}
                disabled={testTool.isPending}
                className="w-full"
              >
                {testTool.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Query...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Test Query
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Test Results */}
          {testResults && (
            <div className="rounded-lg border p-4">
              <Label className="text-sm font-semibold">Test Results</Label>
              {testResults.success ? (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Returned {testResults.rowCount} rows in {testResults.executionTime}ms
                  </p>
                  {testResults.rows.length > 0 && (
                    <div className="overflow-x-auto">
                      <pre className="rounded-md bg-slate-50 p-3 text-xs">
                        {JSON.stringify(testResults.rows, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-destructive">
                  Error: {testResults.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 border-t pt-4">
          {/* Create Mode Actions */}
          {isCreateMode && currentTool && (
            <>
              <Button onClick={onCreateAnother} variant="outline" className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Create Another Tool
              </Button>
              <Button onClick={onSaveTool} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Save Tool
              </Button>
            </>
          )}

          {/* Edit Mode Actions */}
          {isEditMode && (
            <>
              {!showDeleteConfirm ? (
                <>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    disabled={deleteTool.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <Button onClick={handleClose} variant="outline" className="flex-1">
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onDeleteTool}
                    variant="destructive"
                    disabled={deleteTool.isPending}
                    className="flex-1"
                  >
                    {deleteTool.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Confirm Delete
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
