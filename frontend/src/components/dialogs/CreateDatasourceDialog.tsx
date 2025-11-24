import { useState } from "react";
import { useForm } from "react-hook-form";
import { CreateDatasourceDto } from "shared";
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
  /** Optional callback function triggered when a datasource is successfully created */
  onSuccess?: () => void;
}

/**
 * CreateDatasourceDialog component provides a form dialog for creating new MySQL datasources.
 *
 * Features:
 * - Form validation using react-hook-form
 * - Connection testing before creation
 * - Real-time error feedback
 * - Loading states for async operations
 * - Automatic form reset on close or success
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
 * @returns A dialog containing the datasource creation form
 */
export function CreateDatasourceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateDatasourceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<CreateDatasourceDto>({
    defaultValues: {
      type: "mysql",
      port: 3306,
    },
  });

  /**
   * Tests the database connection using the current form values.
   * Validates that the provided credentials and connection details are correct
   * before allowing datasource creation.
   *
   * Updates the test status state to show visual feedback to the user.
   */
  const onTestConnection = async () => {
    setTestStatus("testing");
    setError(null);

    try {
      const formData = getValues();
      const response = await fetch(apiUrl("/api/datasources/test"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

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
   * Handles form submission to create a new datasource.
   * Only enabled after a successful connection test.
   *
   * @param data - The validated form data containing datasource configuration
   */
  const onSubmit = async (data: CreateDatasourceDto) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/datasources"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create datasource");
      }

      reset();
      setTestStatus("idle");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create datasource"
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
          <DialogTitle>Add MySQL Datasource</DialogTitle>
          <DialogDescription>
            Connect to your MySQL database to generate MCP servers.
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", { required: "Password is required" })}
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
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
