import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Resource } from './entities/resource.entity';
import { CanvasNode } from '../canvas/entities/canvas-node.entity';
import { CanvasNodeType } from 'shared';
import { CreateResourceDto } from '../dtos';
import { CanvasService } from '../canvas/canvas.service';
import { access, mkdir, constants } from 'fs/promises';
import { join } from 'path';

const STORAGE_PATH = join(process.cwd(), 'public', 'storage');

/**
 * Service responsible for managing file resources attached to MCP servers.
 *
 * Features:
 * - Creates resources with file upload handling
 * - Lists resources with optional MCP server filtering
 * - Deletes resources with file cleanup
 * - Manages canvas node creation/deletion for resources
 * - Ensures storage folder exists on startup
 */
@Injectable()
export class ResourcesService implements OnModuleInit {
  private readonly logger = new Logger(ResourcesService.name);
  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    @InjectDataSource()
    private dataSource: DataSource,
    private canvasService: CanvasService,
  ) {}

  /**
   * Lifecycle hook that runs when the module is initialized.
   * Ensures the storage directory exists and is writable.
   */
  async onModuleInit(): Promise<void> {
    try {
      // Check if storage directory exists
      await access(STORAGE_PATH, constants.F_OK);
      this.logger.log(`Storage directory exists at ${STORAGE_PATH}`);

      // Check if storage directory is writable
      await access(STORAGE_PATH, constants.W_OK);
      this.logger.log('Storage directory is writable');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist, try to create it
        try {
          await mkdir(STORAGE_PATH, { recursive: true });
          this.logger.log(`Created storage directory at ${STORAGE_PATH}`);
        } catch (mkdirError) {
          this.logger.error(`Failed to create storage directory at ${STORAGE_PATH}:`, mkdirError);
          throw new Error(`Storage directory cannot be created: ${STORAGE_PATH}`);
        }
      } else if (error.code === 'EACCES') {
        this.logger.error(`Storage directory is not writable: ${STORAGE_PATH}`);
        throw new Error(`Storage directory is not writable: ${STORAGE_PATH}`);
      } else {
        this.logger.error(`Error accessing storage directory:`, error);
        throw error;
      }
    }
  }

  /**
   * Creates a new resource with the uploaded file.
   *
   * @param createResourceDto - Resource metadata (name, description, mcpServerId)
   * @param file - Uploaded file from Multer
   * @returns The created resource entity
   */
  async create(
    createResourceDto: CreateResourceDto,
    file: Express.Multer.File,
  ): Promise<Resource> {
    const resource = this.resourceRepository.create({
      name: createResourceDto.name,
      description: createResourceDto.description,
      mcpServerId: createResourceDto.mcpServerId,
      filename: file.filename,
      originalFilename: file.originalname,
      filePath: `storage/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    });

    const savedResource = await this.resourceRepository.save(resource);

    // Create canvas node for this resource
    await this.canvasService.create({
      nodeId: `resource-${savedResource.id}`,
      type: CanvasNodeType.RESOURCE,
      positionX: 500,
      positionY: 100,
      resourceId: savedResource.id,
    });

    return savedResource;
  }

  /**
   * Retrieves all resources, optionally filtered by MCP server.
   *
   * @param mcpServerId - Optional MCP server ID to filter by
   * @returns Array of resource entities
   */
  async findAll(mcpServerId?: string): Promise<Resource[]> {
    if (mcpServerId) {
      return this.resourceRepository.find({ where: { mcpServerId } });
    }
    return this.resourceRepository.find();
  }

  /**
   * Retrieves a single resource by ID.
   *
   * @param id - Resource ID
   * @returns The resource entity
   * @throws NotFoundException if resource not found
   */
  async findOne(id: string): Promise<Resource> {
    const resource = await this.resourceRepository.findOne({ where: { id } });
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    return resource;
  }

  /**
   * Deletes a resource, its canvas node, and the uploaded file.
   *
   * @param id - Resource ID to delete
   * @throws NotFoundException if resource not found
   */
  async delete(id: string): Promise<void> {
    const resource = await this.findOne(id);

    // Delete canvas node first
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(CanvasNode)
      .where('resourceId = :id', { id })
      .execute();

    // Delete file from storage
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', resource.filePath);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File may not exist, log but don't fail
      console.warn(`Could not delete file ${filePath}:`, error);
    }

    // Delete resource record
    await this.resourceRepository.delete(id);
  }

  /**
   * Finds all resources for a given MCP server (used for cascade delete).
   *
   * @param mcpServerId - MCP server ID
   * @returns Array of resource entities
   */
  async findByMcpServerId(mcpServerId: string): Promise<Resource[]> {
    return this.resourceRepository.find({ where: { mcpServerId } });
  }
}
