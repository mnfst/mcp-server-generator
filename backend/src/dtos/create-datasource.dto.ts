import { IsString, IsNumber, IsIn } from 'class-validator';

/**
 * Data Transfer Object for creating a new datasource connection.
 *
 * This DTO defines the required fields to establish a database connection.
 * Currently supports MySQL databases with plans to expand to other database types.
 *
 * @example
 * ```typescript
 * const datasource: CreateDatasourceDto = {
 *   name: 'Production MySQL',
 *   type: 'mysql',
 *   host: 'localhost',
 *   port: 3306,
 *   database: 'myapp',
 *   username: 'root',
 *   password: 'secret123'
 * };
 * ```
 */
export class CreateDatasourceDto {
  /**
   * The display name for the datasource.
   * Used for identification in the UI and API responses.
   *
   * @validation Must be a non-empty string
   * @example 'Production MySQL Database'
   */
  @IsString()
  name!: string;

  /**
   * The type of database system.
   * Currently only 'mysql' is supported.
   *
   * @validation Must be one of: 'mysql'
   * @example 'mysql'
   */
  @IsString()
  @IsIn(['mysql'])
  type!: 'mysql';

  /**
   * The hostname or IP address of the database server.
   *
   * @validation Must be a non-empty string
   * @example 'localhost' | 'db.example.com' | '192.168.1.100'
   */
  @IsString()
  host!: string;

  /**
   * The port number on which the database server is listening.
   *
   * @validation Must be a valid number
   * @example 3306 (default MySQL port)
   */
  @IsNumber()
  port!: number;

  /**
   * The name of the database to connect to.
   *
   * @validation Must be a non-empty string
   * @example 'myapp_production'
   */
  @IsString()
  database!: string;

  /**
   * The username for database authentication.
   *
   * @validation Must be a non-empty string
   * @example 'root' | 'db_user'
   */
  @IsString()
  username!: string;

  /**
   * The password for database authentication.
   *
   * @security This field should be handled securely and never logged or exposed in responses
   * @validation Must be a non-empty string
   * @example 'secret_password_123'
   */
  @IsString()
  password!: string;
}
