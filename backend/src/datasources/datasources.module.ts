import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasourcesService } from './datasources.service';
import { DatasourcesController } from './datasources.controller';
import { Datasource } from './entities/datasource.entity';
import { CanvasModule } from '../canvas/canvas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Datasource]),
    CanvasModule,
  ],
  controllers: [DatasourcesController],
  providers: [DatasourcesService],
  exports: [DatasourcesService],
})
export class DatasourcesModule {}
