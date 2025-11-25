/**
 * Utility functions for parsing SQL queries to extract table and column references.
 * Used for highlighting referenced elements in schema views.
 */

/**
 * Extract table and column references from a SQL query.
 * Returns a Set of strings in the format "tableName" or "tableName.columnName"
 *
 * This is a simple regex-based parser that handles common SQL patterns.
 * It's not a full SQL parser but works well for highlighting purposes.
 *
 * @param sql - The SQL query to parse
 * @returns Set of table and column references
 */
export function extractSQLReferences(sql: string): Set<string> {
  const references = new Set<string>();

  if (!sql) return references;

  // Remove SQL comments
  const cleanSQL = sql
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

  // Extract table names from FROM clause
  const fromMatch = cleanSQL.match(/FROM\s+([`"]?\w+[`"]?(?:\s+(?:AS\s+)?[`"]?\w+[`"]?)?)/gi);
  if (fromMatch) {
    fromMatch.forEach((match) => {
      const tableName = match.replace(/FROM\s+/i, '').replace(/[`"]/g, '').split(/\s+/)[0];
      if (tableName) {
        references.add(tableName);
      }
    });
  }

  // Extract table names from JOIN clauses
  const joinMatch = cleanSQL.match(/JOIN\s+([`"]?\w+[`"]?(?:\s+(?:AS\s+)?[`"]?\w+[`"]?)?)/gi);
  if (joinMatch) {
    joinMatch.forEach((match) => {
      const tableName = match.replace(/JOIN\s+/i, '').replace(/[`"]/g, '').split(/\s+/)[0];
      if (tableName) {
        references.add(tableName);
      }
    });
  }

  // Extract table.column references
  const columnMatch = cleanSQL.match(/[`"]?\w+[`"]?\.[`"]?\w+[`"]?/g);
  if (columnMatch) {
    columnMatch.forEach((match) => {
      const cleaned = match.replace(/[`"]/g, '');
      references.add(cleaned);
    });
  }

  // Extract column names from SELECT clause (without table prefix)
  const selectMatch = cleanSQL.match(/SELECT\s+(.*?)\s+FROM/is);
  if (selectMatch && selectMatch[1]) {
    const columns = selectMatch[1].split(',');
    columns.forEach((col) => {
      // Extract column name (handle aliases with AS)
      const colName = col.trim().split(/\s+/)[0].replace(/[`"]/g, '');
      // Only add if it's not a function or *
      if (colName && colName !== '*' && !colName.includes('(')) {
        references.add(colName);
      }
    });
  }

  return references;
}

/**
 * Check if a table or column name matches a SQL reference.
 * Handles both exact matches and partial matches (e.g., "users" matches "users.id")
 *
 * @param reference - The reference from the SQL query
 * @param tableName - The table name to check
 * @param columnName - Optional column name to check
 * @returns true if the reference matches
 */
export function matchesReference(
  reference: string,
  tableName: string,
  columnName?: string
): boolean {
  // Direct table match
  if (reference === tableName) return true;

  // Table.column match
  if (columnName && reference === `${tableName}.${columnName}`) return true;

  // Column name match (without table prefix)
  if (columnName && reference === columnName) return true;

  return false;
}
