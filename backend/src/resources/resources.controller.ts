import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from '../dtos';
import { Resource } from './entities/resource.entity';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Controller for managing file resources attached to MCP servers.
 *
 * Endpoints:
 * - POST /resources - Create a new resource with file upload
 * - GET /resources - List all resources (optional mcpServerId filter)
 * - GET /resources/:id - Get a single resource
 * - GET /resources/:id/download - Download the resource file
 * - DELETE /resources/:id - Delete a resource
 */
@Controller('api/resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  /**
   * Create a new resource with file upload.
   * Uses multipart/form-data with fields: name, description, mcpServerId, file
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/storage',
        filename: (_req, file, cb) => {
          const uniqueFilename = `${randomUUID()}-${file.originalname}`;
          cb(null, uniqueFilename);
        },
      }),
    }),
  )
  async create(
    @Body() createResourceDto: CreateResourceDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<Resource> {
    return this.resourcesService.create(createResourceDto, file);
  }

  /**
   * List all resources, optionally filtered by MCP server ID.
   */
  @Get()
  async findAll(@Query('mcpServerId') mcpServerId?: string): Promise<Resource[]> {
    return this.resourcesService.findAll(mcpServerId);
  }

  /**
   * Get a single resource by ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Resource> {
    return this.resourcesService.findOne(id);
  }

  /**
   * Download the resource file.
   */
  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const resource = await this.resourcesService.findOne(id);
    const filePath = join(process.cwd(), 'public', resource.filePath);
    const fileStream = createReadStream(filePath);

    res.set({
      'Content-Type': resource.mimeType,
      'Content-Disposition': `attachment; filename="${resource.originalFilename}"`,
    });

    return new StreamableFile(fileStream);
  }

  /**
   * Delete a resource and its associated file.
   */
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.resourcesService.delete(id);
  }
}
