import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Datasource } from '../../datasources/entities/datasource.entity';
import { MCPServerStatus } from 'shared';

/**
 * MCPServer entity representing a Model Context Protocol server instance.
 * MCP servers expose datasource tools through the MCP protocol for AI assistants.
 */
@Entity('mcp_servers')
export class MCPServer {
  /** Unique identifier (UUID) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Display name for the MCP server */
  @Column()
  name!: string;

  /** URL-safe unique identifier used in endpoint paths (must be unique) */
  @Column({ unique: true })
  slug!: string;

  /** Foreign key to the datasource this server exposes */
  @Column()
  datasourceId!: string;

  /** Related datasource entity */
  @ManyToOne(() => Datasource)
  @JoinColumn({ name: 'datasourceId' })
  datasource!: Datasource;

  /** Additional server configuration (reserved for future use) */
  @Column({ type: 'json', nullable: true })
  config!: Record<string, any> | null;

  /** Server status (draft, active, or error) */
  @Column({
    type: 'enum',
    enum: ['draft', 'active', 'error'],
    default: 'draft',
  })
  status!: MCPServerStatus;

  /** HTTP endpoint path for MCP protocol requests (e.g., /mcp/my-database) */
  @Column({ nullable: true })
  mcpEndpoint!: string;

  /** Timestamp when the server was created */
  @CreateDateColumn()
  createdAt!: Date;

  /** Timestamp when the server was last updated */
  @UpdateDateColumn()
  updatedAt!: Date;
}
