import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
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
      envFilePath: "../.env",
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(3306),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        CREDENTIALS_ENCRYPTION_KEY: Joi.string().min(32).required(),
        OPENAI_API_KEY: Joi.string().required(),
        BACKEND_PORT: Joi.number().default(3001),
        FRONTEND_URL: Joi.string().optional(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      username: process.env.DB_USERNAME || "root",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_DATABASE || "poc_origin",
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== "production", // Only for development
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
