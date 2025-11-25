import { Module } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { SchemaController } from './schema.controller';
import { DatasourcesModule } from '../datasources/datasources.module';

/**
 * Module for database schema introspection.
 * Provides services and APIs for fetching database metadata from MySQL information_schema.
 */
@Module({
  imports: [DatasourcesModule],
  controllers: [SchemaController],
  providers: [SchemaService],
  exports: [SchemaService],
})
export class SchemaModule {}
