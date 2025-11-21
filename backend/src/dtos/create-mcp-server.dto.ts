import { IsString, IsOptional, Matches } from 'class-validator';

/**
 * Data Transfer Object for creating a new MCP (Model Context Protocol) server.
 *
 * This DTO defines the configuration needed to create an MCP server instance
 * that exposes datasource capabilities through the Model Context Protocol.
 * The server acts as a bridge between AI models and datasources.
 *
 * @example
 * ```typescript
 * const mcpServer: CreateMCPServerDto = {
 *   datasourceId: '123e4567-e89b-12d3-a456-426614174000',
 *   name: 'Production MySQL MCP',
 *   slug: 'prod-mysql-mcp',
 *   version: '1.0.0'
 * };
 * ```
 */
export class CreateMCPServerDto {
  /**
   * The unique identifier of the datasource this MCP server will expose.
   * Must reference an existing datasource.
   *
   * @validation Must be a non-empty string
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @IsString()
  datasourceId!: string;

  /**
   * The human-readable name of the MCP server.
   * Used for display purposes in the UI and API responses.
   *
   * @validation Must be a non-empty string
   * @example 'Production MySQL MCP Server'
   */
  @IsString()
  name!: string;

  /**
   * A URL-friendly identifier for the MCP server.
   * Used in API routes and endpoints.
   *
   * @validation Must contain only lowercase letters, numbers, and hyphens
   * @validation Pattern: /^[a-z0-9-]+$/
   * @example 'prod-mysql-mcp' | 'analytics-db' | 'user-service-db'
   */
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug!: string;

  /**
   * The version identifier for the MCP server.
   * Optional field used for tracking server versions.
   *
   * @validation Must be a string if provided
   * @optional
   * @example '1.0.0' | 'v2.3.1' | 'latest'
   */
  @IsString()
  @IsOptional()
  version?: string;
}
