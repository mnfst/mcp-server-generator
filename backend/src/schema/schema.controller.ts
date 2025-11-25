import { Controller, Get, Post, Param } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { DatabaseSchema } from 'shared';

/**
 * Controller for database schema introspection endpoints.
 * Provides APIs for fetching and refreshing database schema information.
 */
@Controller('api/schema')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  /**
   * GET /api/schema/:datasourceId
   * Retrieves the complete database schema for a datasource.
   * Uses cached schema if available.
   *
   * @param datasourceId - UUID of the datasource
   * @returns Complete database schema with tables, columns, and relationships
   */
  @Get(':datasourceId')
  async getSchema(
    @Param('datasourceId') datasourceId: string,
  ): Promise<DatabaseSchema> {
    return this.schemaService.getSchema(datasourceId);
  }

  /**
   * POST /api/schema/:datasourceId/refresh
   * Refreshes the cached database schema by re-fetching from the database.
   * Use this when database structure has changed.
   *
   * @param datasourceId - UUID of the datasource
   * @returns Updated database schema
   */
  @Post(':datasourceId/refresh')
  async refreshSchema(
    @Param('datasourceId') datasourceId: string,
  ): Promise<DatabaseSchema> {
    return this.schemaService.refreshSchema(datasourceId);
  }
}
