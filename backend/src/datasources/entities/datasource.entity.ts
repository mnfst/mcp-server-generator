import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Datasource entity representing a database connection configuration.
 * Stores connection details with encrypted password for secure access.
 */
@Entity('datasources')
export class Datasource {
  /** Unique identifier (UUID) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Display name for the datasource (must be unique) */
  @Column({ unique: true })
  name!: string;

  /** Database type (currently only MySQL is supported) */
  @Column({ type: 'varchar', default: 'mysql' })
  type!: 'mysql';

  /** Database server hostname or IP address */
  @Column()
  host!: string;

  /** Database server port number */
  @Column()
  port!: number;

  /** Database/schema name to connect to */
  @Column()
  database!: string;

  /** Username for database authentication */
  @Column()
  username!: string;

  /** AES-256 encrypted password (includes IV prefix) */
  @Column({ type: 'text' })
  encryptedPassword!: string;

  /** Connection status (connected, disconnected, or error) */
  @Column({
    type: 'enum',
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected',
  })
  status!: 'connected' | 'disconnected' | 'error';

  /** Timestamp when the datasource was created */
  @CreateDateColumn()
  createdAt!: Date;

  /** Timestamp when the datasource was last updated */
  @UpdateDateColumn()
  updatedAt!: Date;
}
