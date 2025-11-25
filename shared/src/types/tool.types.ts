/**
 * Tool entity representing a custom SQL query tool for an MCP server.
 * Tools are created from natural language prompts and converted to SQL queries using an LLM.
 */
export interface Tool {
  /** Unique identifier for the tool */
  id: string;

  /** Display name for the tool (must be unique within MCP server) */
  name: string;

  /** Human-readable description of what the tool does */
  description: string;

  /** Foreign key reference to the MCP server this tool belongs to */
  mcpServerId: string;

  /** Original natural language prompt used to generate the SQL query */
  prompt: string;

  /** Generated SQL query (SELECT only) */
  sqlQuery: string;

  /** JSON object defining the parameters expected by the query */
  parameters: Record<string, ToolParameter> | null;

  /** Timestamp when the tool was created */
  createdAt: Date;

  /** Timestamp when the tool was last updated */
  updatedAt: Date;
}

/**
 * Parameter definition for a tool's SQL query.
 * Extracted from the natural language prompt by the LLM.
 */
export interface ToolParameter {
  /** Parameter name (e.g., "customer_id", "start_date") */
  name: string;

  /** Parameter data type (string, number, boolean, date) */
  type: 'string' | 'number' | 'boolean' | 'date';

  /** Human-readable description of the parameter */
  description: string;

  /** Whether the parameter is required */
  required: boolean;

  /** Default value for the parameter (optional) */
  defaultValue?: string | number | boolean;
}

/**
 * Result of executing a tool's SQL query for testing.
 */
export interface ToolTestResult {
  /** Whether the query executed successfully */
  success: boolean;

  /** Result rows (limited to first 10) */
  rows: Record<string, any>[];

  /** Number of rows returned */
  rowCount: number;

  /** Query execution time in milliseconds */
  executionTime: number;

  /** Error message if execution failed */
  error?: string;
}
