/**
 * Data Transfer Object for creating a new tool.
 * Used to validate incoming requests for tool creation.
 */
export declare class CreateToolDto {
    /**
     * The MCP server ID this tool belongs to.
     * Must be a valid UUID of an existing MCP server.
     */
    mcpServerId: string;
    /**
     * Display name for the tool.
     * Must be unique within the MCP server.
     * Used in MCP protocol tool listings.
     */
    name: string;
    /**
     * Human-readable description of what the tool does.
     * Shown to users in tool listings and documentation.
     */
    description: string;
    /**
     * Natural language prompt describing the desired query.
     * Will be sent to OpenAI LLM to generate SQL query.
     *
     * Examples:
     * - "Get all active users from the last 30 days"
     * - "Find orders by customer ID with their total amount"
     * - "List top 10 products by sales volume"
     */
    prompt: string;
}
//# sourceMappingURL=create-tool.dto.d.ts.map