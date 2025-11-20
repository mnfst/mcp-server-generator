import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MCPServersService } from './mcp-servers.service';
import { MCPServersController, MCPProtocolController } from './mcp-servers.controller';
import { MCPRuntimeService } from './mcp-runtime.service';
import { MCPServer } from './entities/mcp-server.entity';
import { DatasourcesModule } from '../datasources/datasources.module';

@Module({
  imports: [TypeOrmModule.forFeature([MCPServer]), DatasourcesModule],
  controllers: [MCPServersController, MCPProtocolController],
  providers: [MCPServersService, MCPRuntimeService],
  exports: [MCPServersService, MCPRuntimeService],
})
export class MCPServersModule {}
