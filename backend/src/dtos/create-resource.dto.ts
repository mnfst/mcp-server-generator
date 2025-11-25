import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

/**
 * Data transfer object for creating a new resource.
 * File is handled separately via multipart form data.
 */
export class CreateResourceDto {
  /** Display name for the resource */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  /** Human-readable description */
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  /** ID of the parent MCP server */
  @IsUUID()
  @IsNotEmpty()
  mcpServerId!: string;
}
