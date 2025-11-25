import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { CanvasNodeType } from 'shared';

/**
 * Data Transfer Object for creating a new canvas node.
 *
 * Canvas nodes represent visual elements in the workflow canvas that can be
 * datasources, MCP servers, tools, or add buttons. Each node has a position
 * and may reference a specific entity based on its type.
 *
 * @example
 * ```typescript
 * // Create a datasource node
 * const datasourceNode: CreateCanvasNodeDto = {
 *   nodeId: 'node-123',
 *   type: 'datasource',
 *   positionX: 100,
 *   positionY: 200,
 *   datasourceId: '123e4567-e89b-12d3-a456-426614174000'
 * };
 *
 * // Create an MCP server node
 * const mcpNode: CreateCanvasNodeDto = {
 *   nodeId: 'node-456',
 *   type: 'mcpServer',
 *   positionX: 300,
 *   positionY: 200,
 *   mcpServerId: '789e4567-e89b-12d3-a456-426614174000'
 * };
 * ```
 */
export class CreateCanvasNodeDto {
  /**
   * Unique identifier for the canvas node.
   * Used to track and reference the node within the canvas.
   *
   * @example 'node-123' | 'datasource-node-abc'
   */
  @IsString()
  @IsNotEmpty()
  nodeId!: string;

  /**
   * The type of entity this canvas node represents.
   *
   * - DATASOURCE: A database connection node
   * - MCP_SERVER: An MCP server instance node
   * - TOOL: A tool or function node
   * - RESOURCE: A file resource node
   * - ADD: A button node for adding new elements
   *
   * @example CanvasNodeType.DATASOURCE | CanvasNodeType.MCP_SERVER
   */
  @IsEnum(CanvasNodeType)
  type!: CanvasNodeType;

  /**
   * The horizontal position of the node on the canvas.
   * Measured in pixels from the left edge.
   *
   * @example 100 | 250.5
   */
  @IsNumber()
  positionX!: number;

  /**
   * The vertical position of the node on the canvas.
   * Measured in pixels from the top edge.
   *
   * @example 200 | 350.25
   */
  @IsNumber()
  positionY!: number;

  /**
   * Reference to a datasource entity.
   * Required when type is 'datasource', otherwise should be undefined.
   *
   * @optional
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @IsOptional()
  @IsUUID()
  datasourceId?: string;

  /**
   * Reference to an MCP server entity.
   * Required when type is 'mcpServer', otherwise should be undefined.
   *
   * @optional
   * @example '789e4567-e89b-12d3-a456-426614174000'
   */
  @IsOptional()
  @IsUUID()
  mcpServerId?: string;

  /**
   * Reference to a tool entity.
   * Required when type is 'tool', otherwise should be undefined.
   *
   * @optional
   * @example 'abc12345-e89b-12d3-a456-426614174000'
   */
  @IsOptional()
  @IsUUID()
  toolId?: string;

  /**
   * Reference to a resource entity.
   * Required when type is 'resource', otherwise should be undefined.
   *
   * @optional
   * @example 'def12345-e89b-12d3-a456-426614174000'
   */
  @IsOptional()
  @IsUUID()
  resourceId?: string;
}
