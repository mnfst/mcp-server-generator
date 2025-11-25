import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MCPServersService } from './mcp-servers.service';
import { MCPServersController, MCPProtocolController } from './mcp-servers.controller';
import { MCPRuntimeService } from './mcp-runtime.service';
import { MCPServer } from './entities/mcp-server.entity';
import { DatasourcesModule } from '../datasources/datasources.module';
import { CanvasModule } from '../canvas/canvas.module';
import { ToolsModule } from '../tools/tools.module';
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MCPServer]),
    DatasourcesModule,
    CanvasModule,
    forwardRef(() => ToolsModule),
    forwardRef(() => ResourcesModule),
  ],
  controllers: [MCPServersController, MCPProtocolController],
  providers: [MCPServersService, MCPRuntimeService],
  exports: [MCPServersService, MCPRuntimeService],
})
export class MCPServersModule {}
