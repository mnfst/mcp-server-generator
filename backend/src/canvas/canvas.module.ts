import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanvasService } from './canvas.service';
import { CanvasController } from './canvas.controller';
import { CanvasNode } from './entities/canvas-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CanvasNode])],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService],
})
export class CanvasModule {}
