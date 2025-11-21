import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseSchema, Table, Column, ForeignKey } from 'shared';
import { DatasourcesService } from '../datasources/datasources.service';
import * as mysql from 'mysql2/promise';

/**
 * Service for database schema introspection and caching.
 *
 * Features:
 * - Queries MySQL information_schema for complete schema metadata
 * - In-memory caching by datasource ID
 * - Manual cache refresh capability
 * - Parses tables, columns, data types, and foreign key relationships
 */
@Injectable()
export class SchemaService {
  // In-memory cache: datasourceId -> DatabaseSchema
  private schemaCache = new Map<string, DatabaseSchema>();

  constructor(private datasourcesService: DatasourcesService) {}

  /**
   * Gets the database schema for a datasource, using cache if available.
   *
   * @param datasourceId - UUID of the datasource
   * @returns Promise<DatabaseSchema> containing complete schema information
   * @throws NotFoundException if datasource doesn't exist
   */
  async getSchema(datasourceId: string): Promise<DatabaseSchema> {
    // Check cache first
    const cached = this.schemaCache.get(datasourceId);
    if (cached) {
      return cached;
    }

    // Fetch and cache
    const schema = await this.fetchSchema(datasourceId);
    this.schemaCache.set(datasourceId, schema);
    return schema;
  }

  /**
   * Refreshes the cached schema for a datasource by re-fetching from the database.
   *
   * @param datasourceId - UUID of the datasource
   * @returns Promise<DatabaseSchema> with updated schema information
   */
  async refreshSchema(datasourceId: string): Promise<DatabaseSchema> {
    // Invalidate cache
    this.schemaCache.delete(datasourceId);

    // Fetch fresh schema
    const schema = await this.fetchSchema(datasourceId);
    this.schemaCache.set(datasourceId, schema);
    return schema;
  }

  /**
   * Fetches complete database schema from MySQL information_schema.
   *
   * Queries:
   * - information_schema.TABLES for table metadata
   * - information_schema.COLUMNS for column definitions
   * - information_schema.KEY_COLUMN_USAGE for primary and foreign keys
   *
   * @param datasourceId - UUID of the datasource
   * @returns Promise<DatabaseSchema> with parsed schema data
   */
  private async fetchSchema(datasourceId: string): Promise<DatabaseSchema> {
    const datasource = await this.datasourcesService.findOne(datasourceId);
    if (!datasource) {
      throw new NotFoundException(`Datasource ${datasourceId} not found`);
    }

    // Get decrypted password
    const password = await this.datasourcesService.getDecryptedPassword(
      datasourceId,
    );

    // Create connection
    const connection = await mysql.createConnection({
      host: datasource.host,
      port: datasource.port,
      user: datasource.username,
      password,
      database: datasource.database,
    });

    try {
      // Fetch tables
      const [tableRows] = await connection.execute<any[]>(
        `SELECT
          TABLE_NAME as tableName,
          TABLE_SCHEMA as tableSchema,
          TABLE_ROWS as rowCount,
          TABLE_COMMENT as comment
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME`,
        [datasource.database],
      );

      // Fetch all columns
      const [columnRows] = await connection.execute<any[]>(
        `SELECT
          TABLE_NAME as tableName,
          COLUMN_NAME as columnName,
          DATA_TYPE as dataType,
          CHARACTER_MAXIMUM_LENGTH as maxLength,
          IS_NULLABLE as nullable,
          COLUMN_KEY as columnKey,
          COLUMN_DEFAULT as defaultValue,
          COLUMN_COMMENT as comment,
          COLUMN_TYPE as columnType
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME, ORDINAL_POSITION`,
        [datasource.database],
      );

      // Fetch foreign keys
      const [fkRows] = await connection.execute<any[]>(
        `SELECT
          TABLE_NAME as tableName,
          COLUMN_NAME as columnName,
          CONSTRAINT_NAME as constraintName,
          REFERENCED_TABLE_NAME as referencedTable,
          REFERENCED_COLUMN_NAME as referencedColumn
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME, COLUMN_NAME`,
        [datasource.database],
      );

      // Parse into structured format
      const tables = this.parseSchemaResults(
        tableRows,
        columnRows,
        fkRows,
        datasource.database,
      );

      return {
        databaseName: datasource.database,
        tables,
        lastFetched: new Date(),
      };
    } finally {
      await connection.end();
    }
  }

  /**
   * Parses raw information_schema query results into structured DatabaseSchema format.
   *
   * Groups columns and foreign keys by table and constructs the complete hierarchy.
   *
   * @param tableRows - Raw table metadata rows
   * @param columnRows - Raw column metadata rows
   * @param fkRows - Raw foreign key constraint rows
   * @param schemaName - Database/schema name
   * @returns Array of parsed Table objects
   */
  private parseSchemaResults(
    tableRows: any[],
    columnRows: any[],
    fkRows: any[],
    schemaName: string,
  ): Table[] {
    const tables: Table[] = [];

    for (const tableRow of tableRows) {
      const tableName = tableRow.tableName;

      // Get columns for this table
      const tableColumns = columnRows.filter(
        (col) => col.tableName === tableName,
      );

      // Get foreign keys for this table
      const tableFKs = fkRows.filter((fk) => fk.tableName === tableName);

      // Get list of FK column names for marking columns
      const fkColumnNames = new Set(tableFKs.map((fk) => fk.columnName));

      // Parse columns
      const columns: Column[] = tableColumns.map((col) => {
        // Extract ENUM values if present
        let enumValues: string[] | undefined;
        if (col.columnType && col.columnType.startsWith('enum(')) {
          const match = col.columnType.match(/enum\((.*)\)/);
          if (match) {
            enumValues = match[1]
              .split(',')
              .map((v: string) => v.trim().replace(/'/g, ''));
          }
        }

        return {
          name: col.columnName,
          dataType: col.dataType.toUpperCase(),
          maxLength: col.maxLength ? parseInt(col.maxLength) : undefined,
          nullable: col.nullable === 'YES',
          isPrimaryKey: col.columnKey === 'PRI',
          isForeignKey: fkColumnNames.has(col.columnName),
          defaultValue: col.defaultValue,
          comment: col.comment || undefined,
          enumValues,
        };
      });

      // Parse foreign keys
      const foreignKeys: ForeignKey[] = tableFKs.map((fk) => ({
        constraintName: fk.constraintName,
        columnName: fk.columnName,
        referencedTable: fk.referencedTable,
        referencedColumn: fk.referencedColumn,
      }));

      tables.push({
        name: tableName,
        schema: schemaName,
        columns,
        foreignKeys,
        rowCount: tableRow.rowCount ? parseInt(tableRow.rowCount) : undefined,
        comment: tableRow.comment || undefined,
      });
    }

    return tables;
  }
}
