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
import * as shared from 'shared';

const CanvasNodeType = shared.CanvasNodeType;
type CanvasNodeType = shared.CanvasNodeType;

@Entity('canvas_nodes')
export class CanvasNode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  nodeId!: string;

  @Column({
    type: 'enum',
    enum: CanvasNodeType,
  })
  type!: CanvasNodeType;

  @Column({ type: 'float' })
  positionX!: number;

  @Column({ type: 'float' })
  positionY!: number;

  @Column({ nullable: true })
  datasourceId!: string | null;

  @ManyToOne(() => Datasource, { nullable: true })
  @JoinColumn({ name: 'datasourceId' })
  datasource!: Datasource | null;

  @Column({ nullable: true })
  mcpServerId!: string | null;

  @ManyToOne(() => MCPServer, { nullable: true })
  @JoinColumn({ name: 'mcpServerId' })
  mcpServer!: MCPServer | null;

  @Column({ type: 'varchar', nullable: true })
  toolId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
