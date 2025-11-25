/**
 * Represents a file resource attached to an MCP server.
 * Resources are exposed via the MCP resources protocol for AI assistant access.
 */
export interface Resource {
  /** Unique identifier (UUID) */
  id: string;
  /** Display name for the resource */
  name: string;
  /** Human-readable description of the resource */
  description: string;
  /** UUID-prefixed stored filename */
  filename: string;
  /** User's original filename */
  originalFilename: string;
  /** Relative path to stored file */
  filePath: string;
  /** MIME type of the file (e.g., text/plain, application/pdf) */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** ID of the parent MCP server */
  mcpServerId: string;
  /** Creation timestamp (ISO string) */
  createdAt: string;
  /** Last update timestamp (ISO string) */
  updatedAt: string;
}

/**
 * Data transfer object for creating a new resource.
 * File is handled separately via multipart form data.
 */
export interface CreateResourceDto {
  /** Display name for the resource */
  name: string;
  /** Human-readable description */
  description: string;
  /** ID of the parent MCP server */
  mcpServerId: string;
}
