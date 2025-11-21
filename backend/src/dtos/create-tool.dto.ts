import { IsString, IsNotEmpty, IsUUID, MinLength, MaxLength } from 'class-validator';

/**
 * Data Transfer Object for creating a new tool.
 * Used to validate incoming requests for tool creation.
 */
export class CreateToolDto {
  /**
   * The MCP server ID this tool belongs to.
   * Must be a valid UUID of an existing MCP server.
   */
  @IsUUID()
  @IsNotEmpty()
  mcpServerId!: string;

  /**
   * Display name for the tool.
   * Must be unique within the MCP server.
   * Used in MCP protocol tool listings.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  /**
   * Human-readable description of what the tool does.
   * Shown to users in tool listings and documentation.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  description!: string;

  /**
   * Natural language prompt describing the desired query.
   * Will be sent to OpenAI LLM to generate SQL query.
   *
   * Examples:
   * - "Get all active users from the last 30 days"
   * - "Find orders by customer ID with their total amount"
   * - "List top 10 products by sales volume"
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  prompt!: string;
}
