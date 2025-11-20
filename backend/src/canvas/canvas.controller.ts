import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CanvasService } from './canvas.service';
import { CreateCanvasNodeDto, UpdateCanvasNodeDto } from 'shared';

@Controller('api/canvas/nodes')
export class CanvasController {
  /**
   * Creates a new instance of CanvasController.
   *
   * @param canvasService - The service responsible for canvas node operations
   */
  constructor(private readonly canvasService: CanvasService) {}

  /**
   * Creates a new canvas node with the provided configuration.
   * Canvas nodes represent visual elements on the canvas that can reference datasources or MCP servers.
   *
   * @param createCanvasNodeDto - The data transfer object containing canvas node creation details
   * @returns A promise that resolves to the newly created CanvasNode entity
   */
  @Post()
  create(@Body() createCanvasNodeDto: CreateCanvasNodeDto) {
    return this.canvasService.create(createCanvasNodeDto);
  }

  /**
   * Retrieves all canvas nodes from the system.
   * Includes related datasource and MCP server entities in the result.
   *
   * @returns A promise that resolves to an array of all CanvasNode entities with their relations loaded
   */
  @Get()
  findAll() {
    return this.canvasService.findAll();
  }

  /**
   * Retrieves all canvas nodes associated with a specific entity.
   * This endpoint allows filtering by entity type (datasource, MCP server, or tool) and entity ID.
   *
   * @param entityType - The type of entity to filter by (datasource, mcpServer, or tool)
   * @param entityId - The unique identifier of the entity to find nodes for
   * @returns A promise that resolves to an array of CanvasNode entities matching the entity criteria
   */
  @Get('entity/:entityType/:entityId')
  findByEntity(
    @Param('entityType') entityType: 'datasource' | 'mcpServer' | 'tool',
    @Param('entityId') entityId: string,
  ) {
    return this.canvasService.findByEntity(entityType, entityId);
  }

  /**
   * Updates the position or other properties of a canvas node.
   * This endpoint is typically called when a user drags a node to a new position on the canvas.
   *
   * @param nodeId - The unique node identifier of the canvas node to update
   * @param updateCanvasNodeDto - The data transfer object containing the fields to update
   * @returns A promise that resolves to the updated CanvasNode entity
   * @throws {NotFoundException} When no canvas node exists with the provided node ID
   */
  @Patch(':nodeId')
  updatePosition(
    @Param('nodeId') nodeId: string,
    @Body() updateCanvasNodeDto: UpdateCanvasNodeDto,
  ) {
    return this.canvasService.updatePosition(nodeId, updateCanvasNodeDto);
  }

  /**
   * Updates the positions of multiple canvas nodes in a single batch operation.
   * This is useful when multiple nodes need to be repositioned simultaneously or when layout is recalculated.
   *
   * @param updates - An array of objects containing nodeId and new position coordinates (positionX, positionY)
   * @returns A promise that resolves to an array of updated CanvasNode entities
   * @throws {NotFoundException} When any of the specified node IDs do not exist
   */
  @Patch('batch')
  batchUpdatePositions(
    @Body()
    updates: Array<{ nodeId: string; positionX: number; positionY: number }>,
  ) {
    return this.canvasService.batchUpdatePositions(updates);
  }

  /**
   * Deletes a canvas node from the system.
   * This removes the visual representation but does not delete the underlying entity (datasource or MCP server).
   *
   * @param nodeId - The unique node identifier of the canvas node to delete
   * @returns A promise that resolves when the canvas node is successfully deleted
   * @throws {NotFoundException} When no canvas node exists with the provided node ID
   */
  @Delete(':nodeId')
  delete(@Param('nodeId') nodeId: string) {
    return this.canvasService.delete(nodeId);
  }
}
