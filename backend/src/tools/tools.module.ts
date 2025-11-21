import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tool } from './entities/tool.entity';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { MCPServersModule } from '../mcp-servers/mcp-servers.module';
import { DatasourcesModule } from '../datasources/datasources.module';
import { QueryGenerationModule } from '../query-generation/query-generation.module';
import { SchemaModule } from '../schema/schema.module';

/**
 * Module for SQL query tool management.
 * Provides services and APIs for creating and managing tools with LLM-generated queries.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tool]),
    forwardRef(() => MCPServersModule),
    DatasourcesModule,
    QueryGenerationModule,
    SchemaModule,
  ],
  controllers: [ToolsController],
  providers: [ToolsService],
  exports: [ToolsService],
})
export class ToolsModule {}
