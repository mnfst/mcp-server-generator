import { Module } from '@nestjs/common';
import { QueryGenerationService } from './query-generation.service';

/**
 * Module for LLM-powered SQL query generation.
 * Provides QueryGenerationService for converting natural language to MySQL queries.
 *
 * This is a standalone module with no database dependencies,
 * making it easily testable and reusable.
 */
@Module({
  providers: [QueryGenerationService],
  exports: [QueryGenerationService],
})
export class QueryGenerationModule {}
