import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DatabaseSchema, ToolParameter } from 'shared';

/**
 * Result of SQL query generation from natural language.
 */
export interface QueryGenerationResult {
  /** Generated MySQL SELECT query */
  sqlQuery: string;

  /** Extracted parameters from the prompt */
  parameters: Record<string, ToolParameter>;

  /** Explanation of what the query does */
  explanation: string;
}

/**
 * Service responsible for converting natural language prompts into MySQL queries
 * using OpenAI's GPT models with database schema context.
 *
 * Features:
 * - Structured JSON output for reliable parsing
 * - Schema-aware query generation
 * - Parameter extraction and typing
 * - SELECT-only query validation
 */
@Injectable()
export class QueryGenerationService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
      throw new Error(
        'OPENAI_API_KEY is not configured. Please set it in your .env file.',
      );
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generates a MySQL query from a natural language prompt with schema context.
   *
   * Process:
   * 1. Formats database schema into a readable structure
   * 2. Constructs a prompt with schema context and user request
   * 3. Calls OpenAI API with structured JSON response format
   * 4. Validates the generated query is SELECT-only
   * 5. Parses and returns the query, parameters, and explanation
   *
   * @param prompt - Natural language description of the desired query
   * @param schema - Database schema information for context
   * @returns Promise<QueryGenerationResult> with SQL query, parameters, and explanation
   * @throws BadRequestException if query generation fails or produces invalid SQL
   */
  async generateQuery(
    prompt: string,
    schema: DatabaseSchema,
  ): Promise<QueryGenerationResult> {
    try {
      // Format schema for LLM context
      const schemaContext = this.formatSchemaForPrompt(schema);

      // Construct the system prompt
      const systemPrompt = `You are a MySQL query generator. Given a database schema and a natural language request, generate a MySQL SELECT query.

Database Schema:
${schemaContext}

Rules:
1. ONLY generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
2. Use proper MySQL syntax and functions
3. Extract any parameters from the natural language (e.g., customer_id, start_date)
4. Use parameterized placeholders like :paramName for dynamic values
5. Include JOINs where relationships exist
6. Use appropriate WHERE clauses, ORDER BY, and LIMIT as needed
7. Return the query, parameters, and a brief explanation

Respond with JSON in this exact format:
{
  "sqlQuery": "SELECT ... FROM ... WHERE ...",
  "parameters": {
    "paramName": {
      "name": "paramName",
      "type": "string|number|boolean|date",
      "description": "What this parameter is for",
      "required": true|false
    }
  },
  "explanation": "Brief explanation of what the query does"
}`;

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const result = JSON.parse(content) as QueryGenerationResult;

      // Validate that it's a SELECT query
      if (!this.isSelectQuery(result.sqlQuery)) {
        throw new Error(
          'Generated query is not a SELECT statement. Only SELECT queries are allowed.',
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific OpenAI errors
        if (error.message.includes('API key')) {
          throw new BadRequestException(
            'OpenAI API key is invalid. Please check your configuration.',
          );
        }
        if (error.message.includes('rate limit')) {
          throw new BadRequestException(
            'OpenAI API rate limit exceeded. Please try again in a moment.',
          );
        }
        if (error.message.includes('timeout')) {
          throw new BadRequestException(
            'OpenAI API request timed out. Please try again.',
          );
        }
        throw new BadRequestException(
          `Query generation failed: ${error.message}`,
        );
      }
      throw new BadRequestException('Query generation failed');
    }
  }

  /**
   * Formats the database schema into a readable string for the LLM prompt.
   * Includes table names, columns with types, and foreign key relationships.
   *
   * @param schema - Database schema to format
   * @returns Formatted schema string
   */
  private formatSchemaForPrompt(schema: DatabaseSchema): string {
    const lines: string[] = [];

    for (const table of schema.tables) {
      lines.push(`\nTable: ${table.name}`);

      // Add columns
      lines.push('Columns:');
      for (const column of table.columns) {
        const nullable = column.nullable ? 'NULL' : 'NOT NULL';
        const pk = column.isPrimaryKey ? ' [PRIMARY KEY]' : '';
        const fk = column.isForeignKey ? ' [FOREIGN KEY]' : '';
        lines.push(
          `  - ${column.name}: ${column.dataType} ${nullable}${pk}${fk}`,
        );
      }

      // Add foreign keys
      if (table.foreignKeys.length > 0) {
        lines.push('Foreign Keys:');
        for (const fk of table.foreignKeys) {
          lines.push(
            `  - ${fk.columnName} -> ${fk.referencedTable}.${fk.referencedColumn}`,
          );
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Validates that a SQL query is a SELECT statement only.
   * Prevents injection of dangerous queries (INSERT, UPDATE, DELETE, etc.)
   *
   * @param query - SQL query to validate
   * @returns true if the query is a valid SELECT statement
   */
  private isSelectQuery(query: string): boolean {
    const trimmed = query.trim().toUpperCase();

    // Must start with SELECT
    if (!trimmed.startsWith('SELECT')) {
      return false;
    }

    // Check for dangerous keywords
    const dangerousKeywords = [
      'INSERT',
      'UPDATE',
      'DELETE',
      'DROP',
      'CREATE',
      'ALTER',
      'TRUNCATE',
      'REPLACE',
      'GRANT',
      'REVOKE',
    ];

    for (const keyword of dangerousKeywords) {
      if (trimmed.includes(keyword)) {
        return false;
      }
    }

    return true;
  }
}
