import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('datasources')
export class Datasource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'varchar', default: 'mysql' })
  type!: 'mysql';

  @Column()
  host!: string;

  @Column()
  port!: number;

  @Column()
  database!: string;

  @Column()
  username!: string;

  @Column({ type: 'text' })
  encryptedPassword!: string;

  @Column({
    type: 'enum',
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected',
  })
  status!: 'connected' | 'disconnected' | 'error';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
