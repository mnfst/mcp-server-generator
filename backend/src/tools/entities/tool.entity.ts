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
import { ToolParameter } from 'shared';

/**
 * Tool entity representing a custom SQL query tool for an MCP server.
 * Tools are created from natural language prompts and executed against datasources.
 */
@Entity('tools')
@Unique(['mcpServerId', 'name']) // Ensure tool names are unique within each MCP server
export class Tool {
  /** Unique identifier (UUID) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Tool name (must be unique within the MCP server) */
  @Column()
  name!: string;

  /** Human-readable description of what the tool does */
  @Column({ type: 'text' })
  description!: string;

  /** Foreign key to the MCP server this tool belongs to */
  @Column()
  @Index()
  mcpServerId!: string;

  /** Related MCP server entity */
  @ManyToOne(() => MCPServer)
  @JoinColumn({ name: 'mcpServerId' })
  mcpServer!: MCPServer;

  /** Natural language prompt used to generate the SQL query */
  @Column({ type: 'text' })
  prompt!: string;

  /** Generated SQL query (SELECT only) */
  @Column({ type: 'text' })
  sqlQuery!: string;

  /** Parameter definitions extracted from the prompt */
  @Column({ type: 'json', nullable: true })
  parameters!: Record<string, ToolParameter> | null;

  /** Timestamp when the tool was created */
  @CreateDateColumn()
  createdAt!: Date;

  /** Timestamp when the tool was last updated */
  @UpdateDateColumn()
  updatedAt!: Date;
}
