import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { DatasourcesModule } from "./datasources/datasources.module";
import { MCPServersModule } from "./mcp-servers/mcp-servers.module";
import { CanvasModule } from "./canvas/canvas.module";
import { ToolsModule } from "./tools/tools.module";
import { SchemaModule } from "./schema/schema.module";
import { QueryGenerationModule } from "./query-generation/query-generation.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      username: process.env.DB_USERNAME || "root",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_DATABASE || "poc_origin",
      autoLoadEntities: true,
      synchronize: true, // Only for development
    }),
    DatasourcesModule,
    MCPServersModule,
    CanvasModule,
    ToolsModule,
    SchemaModule,
    QueryGenerationModule,
  ],
})
export class AppModule {}
