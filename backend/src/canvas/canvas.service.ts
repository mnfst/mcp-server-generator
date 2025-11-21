import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanvasNode } from './entities/canvas-node.entity';
import { CreateCanvasNodeDto, UpdateCanvasNodeDto } from '../dtos';

@Injectable()
export class CanvasService {
  /**
   * Creates a new instance of CanvasService.
   *
   * @param canvasNodeRepository - The TypeORM repository for managing CanvasNode entities
   */
  constructor(
    @InjectRepository(CanvasNode)
    private canvasNodeRepository: Repository<CanvasNode>,
  ) {}

  /**
   * Creates a new canvas node with the provided configuration.
   * Canvas nodes represent visual elements on the canvas that can reference datasources or MCP servers.
   *
   * @param createCanvasNodeDto - The data transfer object containing canvas node creation details
   * @returns A promise that resolves to the newly created CanvasNode entity
   */
  async create(createCanvasNodeDto: CreateCanvasNodeDto): Promise<CanvasNode> {
    const canvasNode = this.canvasNodeRepository.create(createCanvasNodeDto);
    return this.canvasNodeRepository.save(canvasNode);
  }

  /**
   * Retrieves all canvas nodes from the system.
   * Includes related datasource and MCP server entities in the result.
   *
   * @returns A promise that resolves to an array of all CanvasNode entities with their relations loaded
   */
  async findAll(): Promise<CanvasNode[]> {
    return this.canvasNodeRepository.find({
      relations: ['datasource', 'mcpServer'],
    });
  }

  /**
   * Retrieves a specific canvas node by its unique node identifier.
   * Includes related datasource and MCP server entities in the result.
   *
   * @param nodeId - The unique node identifier of the canvas node to retrieve
   * @returns A promise that resolves to the CanvasNode entity with its relations loaded
   * @throws {NotFoundException} When no canvas node exists with the provided node ID
   */
  async findByNodeId(nodeId: string): Promise<CanvasNode> {
    const canvasNode = await this.canvasNodeRepository.findOne({
      where: { nodeId },
      relations: ['datasource', 'mcpServer'],
    });
    if (!canvasNode) {
      throw new NotFoundException(`Canvas node with ID ${nodeId} not found`);
    }
    return canvasNode;
  }

  /**
   * Retrieves all canvas nodes associated with a specific entity.
   * Allows filtering by entity type (datasource, MCP server, or tool) and entity ID.
   *
   * @param entityType - The type of entity to filter by (datasource, mcpServer, or tool)
   * @param entityId - The unique identifier of the entity to find nodes for
   * @returns A promise that resolves to an array of CanvasNode entities matching the entity criteria
   */
  async findByEntity(
    entityType: 'datasource' | 'mcpServer' | 'tool',
    entityId: string,
  ): Promise<CanvasNode[]> {
    const where: any = {};
    if (entityType === 'datasource') {
      where.datasourceId = entityId;
    } else if (entityType === 'mcpServer') {
      where.mcpServerId = entityId;
    } else if (entityType === 'tool') {
      where.toolId = entityId;
    }

    return this.canvasNodeRepository.find({
      where,
      relations: ['datasource', 'mcpServer'],
    });
  }

  /**
   * Updates the position or other properties of a canvas node.
   * This method is typically used when a user drags a node to a new position on the canvas.
   *
   * @param nodeId - The unique node identifier of the canvas node to update
   * @param updateCanvasNodeDto - The data transfer object containing the fields to update
   * @returns A promise that resolves to the updated CanvasNode entity
   * @throws {NotFoundException} When no canvas node exists with the provided node ID
   */
  async updatePosition(
    nodeId: string,
    updateCanvasNodeDto: UpdateCanvasNodeDto,
  ): Promise<CanvasNode> {
    const canvasNode = await this.findByNodeId(nodeId);
    Object.assign(canvasNode, updateCanvasNodeDto);
    return this.canvasNodeRepository.save(canvasNode);
  }

  /**
   * Updates the positions of multiple canvas nodes in a single operation.
   * This is useful for batch updates when multiple nodes are moved simultaneously or layout is recalculated.
   *
   * @param updates - An array of objects containing nodeId and new position coordinates (positionX, positionY)
   * @returns A promise that resolves to an array of updated CanvasNode entities
   * @throws {NotFoundException} When any of the specified node IDs do not exist
   */
  async batchUpdatePositions(
    updates: Array<{ nodeId: string; positionX: number; positionY: number }>,
  ): Promise<CanvasNode[]> {
    const results: CanvasNode[] = [];
    for (const update of updates) {
      const canvasNode = await this.findByNodeId(update.nodeId);
      canvasNode.positionX = update.positionX;
      canvasNode.positionY = update.positionY;
      results.push(await this.canvasNodeRepository.save(canvasNode));
    }
    return results;
  }

  /**
   * Deletes a canvas node from the system.
   * This removes the visual representation but does not delete the underlying entity (datasource or MCP server).
   *
   * @param nodeId - The unique node identifier of the canvas node to delete
   * @returns A promise that resolves when the canvas node is successfully deleted
   * @throws {NotFoundException} When no canvas node exists with the provided node ID
   */
  async delete(nodeId: string): Promise<void> {
    const result = await this.canvasNodeRepository.delete({ nodeId });
    if (result.affected === 0) {
      throw new NotFoundException(`Canvas node with ID ${nodeId} not found`);
    }
  }
}
