import { useState } from 'react';
import { DatabaseSchema, Table, Column } from 'shared';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight } from 'lucide-react';

interface SchemaListViewProps {
  /** Database schema to display */
  schema: DatabaseSchema;
  /** Optional set of table/column names to highlight */
  highlighting?: Set<string>;
}

/**
 * SchemaListView component displays database schema in an accordion format.
 *
 * Features:
 * - Accordion view with tables as accordion items
 * - Each table shows columns with data types
 * - Foreign keys indicated with arrow icon and target table
 * - Search/filter functionality for tables and columns
 * - Optional highlighting of referenced tables/columns
 */
export function SchemaListView({ schema, highlighting }: SchemaListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter tables and columns based on search term
  const filteredTables = schema.tables.filter((table) => {
    const tableMatch = table.name.toLowerCase().includes(searchTerm.toLowerCase());
    const columnMatch = table.columns.some((col) =>
      col.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return tableMatch || columnMatch;
  });

  /**
   * Check if a table/column should be highlighted
   */
  const isHighlighted = (name: string): boolean => {
    return highlighting?.has(name) || false;
  };

  /**
   * Get display name for a column's data type
   */
  const getColumnType = (column: Column): string => {
    let type = column.dataType.toUpperCase();
    if (column.maxLength) {
      type += `(${column.maxLength})`;
    }
    return type;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tables and columns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Schema Info */}
      <div className="text-sm text-muted-foreground">
        Database: <span className="font-semibold">{schema.databaseName}</span>
        {' • '}
        {filteredTables.length} {filteredTables.length === 1 ? 'table' : 'tables'}
      </div>

      {/* Tables Accordion */}
      {filteredTables.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No tables found matching "{searchTerm}"
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {filteredTables.map((table) => (
            <AccordionItem key={table.name} value={table.name}>
              <AccordionTrigger
                className={
                  isHighlighted(table.name)
                    ? 'bg-yellow-50 hover:bg-yellow-100 px-4 rounded-md'
                    : 'px-4'
                }
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{table.name}</span>
                  {table.rowCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({table.rowCount.toLocaleString()} rows)
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {table.comment && (
                  <p className="mb-3 text-sm text-muted-foreground italic">
                    {table.comment}
                  </p>
                )}

                {/* Columns List */}
                <div className="space-y-2">
                  {table.columns
                    .filter(
                      (col) =>
                        !searchTerm ||
                        col.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((column) => (
                      <div
                        key={column.name}
                        className={`rounded-md border p-2 ${
                          isHighlighted(`${table.name}.${column.name}`)
                            ? 'bg-yellow-50 border-yellow-300'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">
                                {column.name}
                              </span>
                              {column.isPrimaryKey && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                                  PK
                                </span>
                              )}
                              {column.isNullable && (
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                                  NULL
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{getColumnType(column)}</span>
                              {column.defaultValue && (
                                <span>Default: {column.defaultValue}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Foreign Key Reference */}
                        {column.foreignKey && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                            <ArrowRight className="h-3 w-3" />
                            <span>
                              References{' '}
                              <span className="font-mono font-semibold">
                                {column.foreignKey.referencedTable}.
                                {column.foreignKey.referencedColumn}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                {/* Additional Foreign Keys (if any beyond column-level) */}
                {table.foreignKeys && table.foreignKeys.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">
                      Foreign Keys
                    </p>
                    {table.foreignKeys.map((fk, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 text-xs text-blue-600"
                      >
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-mono">
                          {fk.columnName} → {fk.referencedTable}.{fk.referencedColumn}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
