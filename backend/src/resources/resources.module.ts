import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from './entities/resource.entity';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { CanvasModule } from '../canvas/canvas.module';

/**
 * Module for managing file resources attached to MCP servers.
 *
 * Provides:
 * - ResourcesService for business logic
 * - ResourcesController for REST API endpoints
 * - TypeORM repository for Resource entity
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Resource]),
    forwardRef(() => CanvasModule),
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
