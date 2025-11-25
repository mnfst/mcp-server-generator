import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { MCPServer } from '../../mcp-servers/entities/mcp-server.entity';

/**
 * Resource entity representing a file resource attached to an MCP server.
 * Resources are exposed via the MCP resources protocol for AI assistant access.
 */
@Entity('resources')
@Unique(['mcpServerId', 'name'])
export class Resource {
  /** Unique identifier (UUID) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Display name for the resource (must be unique within MCP server) */
  @Column({ length: 255 })
  name!: string;

  /** Human-readable description of the resource */
  @Column({ type: 'text' })
  description!: string;

  /** UUID-prefixed stored filename */
  @Column({ length: 500 })
  filename!: string;

  /** User's original filename */
  @Column({ length: 255 })
  originalFilename!: string;

  /** Relative path to stored file */
  @Column({ length: 1000 })
  filePath!: string;

  /** MIME type of the file (e.g., text/plain, application/pdf) */
  @Column({ length: 100 })
  mimeType!: string;

  /** File size in bytes */
  @Column({ type: 'int' })
  size!: number;

  /** Foreign key to the parent MCP server */
  @Column()
  @Index()
  mcpServerId!: string;

  /** Related MCP server entity */
  @ManyToOne(() => MCPServer)
  @JoinColumn({ name: 'mcpServerId' })
  mcpServer!: MCPServer;

  /** Timestamp when the resource was created */
  @CreateDateColumn()
  createdAt!: Date;

  /** Timestamp when the resource was last updated */
  @UpdateDateColumn()
  updatedAt!: Date;
}
