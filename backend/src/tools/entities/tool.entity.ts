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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  @Index()
  mcpServerId!: string;

  @ManyToOne(() => MCPServer)
  @JoinColumn({ name: 'mcpServerId' })
  mcpServer!: MCPServer;

  @Column({ type: 'text' })
  prompt!: string;

  @Column({ type: 'text' })
  sqlQuery!: string;

  @Column({ type: 'json', nullable: true })
  parameters!: Record<string, ToolParameter> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
