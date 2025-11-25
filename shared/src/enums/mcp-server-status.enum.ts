/**
 * Enum representing the possible statuses of an MCP server.
 *
 * - draft: Server is configured but not yet activated
 * - active: Server is running and operational
 * - error: Server encountered an error during activation or operation
 */
export enum MCPServerStatus {
  /**
   * Server is configured but not yet activated.
   * In this state, the server exists in the database but is not serving requests.
   */
  DRAFT = 'draft',

  /**
   * Server is active and operational.
   * The server is running and can handle MCP requests.
   */
  ACTIVE = 'active',

  /**
   * Server encountered an error.
   * This could be due to configuration issues, connection problems, or runtime errors.
   */
  ERROR = 'error',
}
