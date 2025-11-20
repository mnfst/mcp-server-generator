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

@Entity('mcp_servers')
export class MCPServer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  datasourceId!: string;

  @ManyToOne(() => Datasource)
  @JoinColumn({ name: 'datasourceId' })
  datasource!: Datasource;

  @Column({ type: 'json', nullable: true })
  config!: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: ['draft', 'active', 'error'],
    default: 'draft',
  })
  status!: 'draft' | 'active' | 'error';

  @Column({ nullable: true })
  mcpEndpoint!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
