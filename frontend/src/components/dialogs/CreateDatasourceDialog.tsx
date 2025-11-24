import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CreateDatasourceDto, Datasource } from "shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

/**
 * Props for the CreateDatasourceDialog component.
 */
interface CreateDatasourceDialogProps {
  /** Controls the visibility of the dialog */
  open: boolean;
  /** Callback function to update the open state of the dialog */
  onOpenChange: (open: boolean) => void;
  /** Optional callback function triggered when a datasource is successfully created/updated */
  onSuccess?: () => void;
  /** Optional datasource to edit (enables edit mode) */
  datasource?: Datasource;
}

/**
 * CreateDatasourceDialog component provides a form dialog for creating or editing MySQL datasources.
 *
 * Features:
 * - Form validation using react-hook-form
 * - Connection testing before creation
 * - Real-time error feedback
 * - Loading states for async operations
 * - Automatic form reset on close or success
 * - Edit mode with pre-populated fields
 *
 * Required fields:
 * - Name: Display name for the datasource
 * - Host: MySQL server hostname
 * - Port: MySQL server port (default: 3306)
 * - Database: Target database name
 * - Username: Database user credentials
 * - Password: Database password
 *
 * @param props - The component props
 * @returns A dialog containing the datasource creation/edit form
 */
export function CreateDatasourceDialog({
  open,
  onOpenChange,
  onSuccess,
  datasource,
}: CreateDatasourceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");

  const isEditMode = !!datasource;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm<CreateDatasourceDto>({
    defaultValues: {
      type: "mysql",
      port: 3306,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (datasource && open) {
      setValue("name", datasource.name);
      setValue("host", datasource.host);
      setValue("port", datasource.port);
      setValue("database", datasource.database);
      setValue("username", datasource.username);
      setValue("password", ""); // Don't populate password for security
      setValue("type", "mysql");
      // In edit mode, allow submit without re-testing if no password change
      setTestStatus("idle");
    }
  }, [datasource, open, setValue]);

  /**
   * Tests the database connection using the current form values.
   * In edit mode with no password change, tests using stored credentials.
   * Validates that the provided credentials and connection details are correct
   * before allowing datasource creation/update.
   *
   * Updates the test status state to show visual feedback to the user.
   */
  const onTestConnection = async () => {
    setTestStatus("testing");
    setError(null);

    try {
      const formData = getValues();

      // In edit mode without password, test using stored credentials
      // Otherwise test with provided form data
      const hasNewPassword = formData.password && formData.password.length > 0;

      let response;
      if (isEditMode && !hasNewPassword) {
        // Test existing datasource with stored credentials
        response = await fetch(apiUrl(`/api/datasources/${datasource!.id}/test`), {
          method: "POST",
        });
      } else {
        // Test with provided credentials
        response = await fetch(apiUrl("/api/datasources/test"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Connection test failed");
      }

      setTestStatus("success");
    } catch (err) {
      setTestStatus("error");
      setError(err instanceof Error ? err.message : "Connection test failed");
    }
  };

  /**
   * Handles form submission to create or update a datasource.
   * Only enabled after a successful connection test.
   *
   * @param data - The validated form data containing datasource configuration
   */
  const onSubmit = async (data: CreateDatasourceDto) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditMode
        ? apiUrl(`/api/datasources/${datasource.id}`)
        : apiUrl("/api/datasources");
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} datasource`);
      }

      reset();
      setTestStatus("idle");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} datasource`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles dialog close event.
   * Resets form state, errors, and test status to initial values.
   */
  const handleClose = () => {
    reset();
    setError(null);
    setTestStatus("idle");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Add'} MySQL Datasource</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your MySQL database connection settings.'
              : 'Connect to your MySQL database to generate MCP servers.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Database"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Host */}
            <div className="grid gap-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                placeholder="localhost"
                {...register("host", { required: "Host is required" })}
              />
              {errors.host && (
                <p className="text-sm text-red-500">{errors.host.message}</p>
              )}
            </div>

            {/* Port */}
            <div className="grid gap-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="3306"
                {...register("port", {
                  required: "Port is required",
                  valueAsNumber: true,
                })}
              />
              {errors.port && (
                <p className="text-sm text-red-500">{errors.port.message}</p>
              )}
            </div>

            {/* Database */}
            <div className="grid gap-2">
              <Label htmlFor="database">Database</Label>
              <Input
                id="database"
                placeholder="my_database"
                {...register("database", { required: "Database is required" })}
              />
              {errors.database && (
                <p className="text-sm text-red-500">
                  {errors.database.message}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="root"
                {...register("username", { required: "Username is required" })}
              />
              {errors.username && (
                <p className="text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">
                Password
                {isEditMode && <span className="text-muted-foreground text-xs ml-2">(leave blank to keep current)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", { required: !isEditMode ? "Password is required" : false })}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Test Connection Button */}
            <Button
              type="button"
              variant="outline"
              onClick={onTestConnection}
              disabled={testStatus === "testing"}
            >
              {testStatus === "testing" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {testStatus === "success"
                ? "Connection Successful!"
                : "Test Connection"}
            </Button>

            {/* Status Messages */}
            {testStatus === "success" && (
              <p className="text-sm text-green-500">
                Connection test successful!
              </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || testStatus !== "success"}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditMode ? 'Save Changes' : 'Connect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
