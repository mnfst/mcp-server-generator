/**
 * Complete database schema information for a datasource.
 * Retrieved from MySQL information_schema tables.
 */
export interface DatabaseSchema {
    /** Name of the database */
    databaseName: string;
    /** List of tables in the database */
    tables: Table[];
    /** Timestamp when the schema was last fetched */
    lastFetched: Date;
}
/**
 * Table definition with columns and relationships.
 */
export interface Table {
    /** Table name */
    name: string;
    /** Schema/database the table belongs to */
    schema: string;
    /** List of columns in the table */
    columns: Column[];
    /** Foreign key relationships originating from this table */
    foreignKeys: ForeignKey[];
    /** Approximate row count (from information_schema) */
    rowCount?: number;
    /** Table comment/description */
    comment?: string;
}
/**
 * Column definition with data type and constraints.
 */
export interface Column {
    /** Column name */
    name: string;
    /** MySQL data type (e.g., VARCHAR, INT, DATETIME) */
    dataType: string;
    /** Maximum character length for string types */
    maxLength?: number;
    /** Whether the column allows NULL values */
    nullable: boolean;
    /** Whether this is a primary key column */
    isPrimaryKey: boolean;
    /** Whether this column is part of a foreign key */
    isForeignKey: boolean;
    /** Default value for the column */
    defaultValue?: string;
    /** Column comment/description */
    comment?: string;
    /** For ENUM types, the list of allowed values */
    enumValues?: string[];
}
/**
 * Foreign key relationship between tables.
 */
export interface ForeignKey {
    /** Name of the foreign key constraint */
    constraintName: string;
    /** Source column name in the current table */
    columnName: string;
    /** Referenced table name */
    referencedTable: string;
    /** Referenced column name in the target table */
    referencedColumn: string;
    /** Action on UPDATE (CASCADE, SET NULL, RESTRICT, etc.) */
    onUpdate?: string;
    /** Action on DELETE (CASCADE, SET NULL, RESTRICT, etc.) */
    onDelete?: string;
}
//# sourceMappingURL=schema.types.d.ts.map