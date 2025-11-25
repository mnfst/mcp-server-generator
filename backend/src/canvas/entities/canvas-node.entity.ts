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
import { MCPServer } from '../../mcp-servers/entities/mcp-server.entity';
import { Resource } from '../../resources/entities/resource.entity';
import * as shared from 'shared';

const CanvasNodeType = shared.CanvasNodeType;
type CanvasNodeType = shared.CanvasNodeType;

/**
 * CanvasNode entity representing a visual node on the workflow canvas.
 * Nodes can represent datasources, MCP servers, tools, resources, or add buttons.
 */
@Entity('canvas_nodes')
export class CanvasNode {
  /** Unique identifier (UUID) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** User-defined node identifier, unique across the canvas */
  @Column({ unique: true })
  nodeId!: string;

  /** Type of node (datasource, mcpServer, tool, or add button) */
  @Column({
    type: 'enum',
    enum: CanvasNodeType,
  })
  type!: CanvasNodeType;

  /** Horizontal position on the canvas (in pixels) */
  @Column({ type: 'float' })
  positionX!: number;

  /** Vertical position on the canvas (in pixels) */
  @Column({ type: 'float' })
  positionY!: number;

  /** Foreign key to datasource (when type is DATASOURCE) */
  @Column({ nullable: true })
  datasourceId!: string | null;

  /** Related datasource entity */
  @ManyToOne(() => Datasource, { nullable: true })
  @JoinColumn({ name: 'datasourceId' })
  datasource!: Datasource | null;

  /** Foreign key to MCP server (when type is MCP_SERVER) */
  @Column({ nullable: true })
  mcpServerId!: string | null;

  /** Related MCP server entity */
  @ManyToOne(() => MCPServer, { nullable: true })
  @JoinColumn({ name: 'mcpServerId' })
  mcpServer!: MCPServer | null;

  /** Foreign key to tool (when type is TOOL) */
  @Column({ type: 'varchar', nullable: true })
  toolId!: string | null;

  /** Foreign key to resource (when type is RESOURCE) */
  @Column({ type: 'varchar', nullable: true })
  resourceId!: string | null;

  /** Related resource entity */
  @ManyToOne(() => Resource, { nullable: true })
  @JoinColumn({ name: 'resourceId' })
  resource!: Resource | null;

  /** Timestamp when the node was created */
  @CreateDateColumn()
  createdAt!: Date;

  /** Timestamp when the node was last updated */
  @UpdateDateColumn()
  updatedAt!: Date;
}
