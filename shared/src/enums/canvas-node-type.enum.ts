/**
 * Enum representing the possible types of canvas nodes.
 *
 * - DATASOURCE: A database connection node
 * - MCP_SERVER: An MCP server instance node
 * - TOOL: A tool or function node
 * - RESOURCE: A file resource node attached to an MCP server
 * - ADD: A button node for adding new elements
 */
export enum CanvasNodeType {
  /**
   * A database connection node.
   */
  DATASOURCE = 'datasource',

  /**
   * An MCP server instance node.
   */
  MCP_SERVER = 'mcpServer',

  /**
   * A tool or function node.
   */
  TOOL = 'tool',

  /**
   * A file resource node attached to an MCP server.
   */
  RESOURCE = 'resource',

  /**
   * A button node for adding new elements.
   */
  ADD = 'add',
}
