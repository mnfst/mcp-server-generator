import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DatasourcesService } from './datasources.service';
import { CreateDatasourceDto } from 'shared';

@Controller('api/datasources')
export class DatasourcesController {
  /**
   * Creates a new instance of DatasourcesController.
   *
   * @param datasourcesService - The service responsible for datasource operations
   */
  constructor(private readonly datasourcesService: DatasourcesService) {}

  /**
   * Creates a new datasource with the provided configuration.
   *
   * @param createDatasourceDto - The data transfer object containing datasource creation details
   * @returns A promise that resolves to the created datasource entity
   * @throws {BadRequestException} When the datasource configuration is invalid
   */
  @Post()
  create(@Body() createDatasourceDto: CreateDatasourceDto) {
    return this.datasourcesService.create(createDatasourceDto);
  }

  /**
   * Retrieves all datasources from the system.
   *
   * @returns A promise that resolves to an array of all datasource entities
   */
  @Get()
  findAll() {
    return this.datasourcesService.findAll();
  }

  /**
   * Retrieves a specific datasource by its unique identifier.
   *
   * @param id - The unique identifier of the datasource to retrieve
   * @returns A promise that resolves to the datasource entity
   * @throws {NotFoundException} When no datasource exists with the provided ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datasourcesService.findOne(id);
  }

  /**
   * Updates an existing datasource with partial data.
   *
   * @param id - The unique identifier of the datasource to update
   * @param updateData - Partial datasource data containing the fields to update
   * @returns A promise that resolves to the updated datasource entity
   * @throws {NotFoundException} When no datasource exists with the provided ID
   * @throws {BadRequestException} When the update data is invalid
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateDatasourceDto>,
  ) {
    return this.datasourcesService.update(id, updateData);
  }

  /**
   * Deletes a datasource from the system.
   *
   * @param id - The unique identifier of the datasource to delete
   * @returns A promise that resolves when the datasource is successfully deleted
   * @throws {NotFoundException} When no datasource exists with the provided ID
   */
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.datasourcesService.delete(id);
  }

  /**
   * Tests the connection to a datasource using the provided configuration without saving it.
   * This endpoint is useful for validating datasource credentials before creation.
   *
   * @param datasourceDto - The data transfer object containing datasource connection details to test
   * @returns A promise that resolves to an object containing success status and message
   */
  @Post('test')
  async testConnectionDirect(@Body() datasourceDto: CreateDatasourceDto) {
    const canConnect = await this.datasourcesService.testConnection(datasourceDto);
    return {
      success: canConnect,
      message: canConnect ? 'Connection successful' : 'Connection failed',
    };
  }

  /**
   * Tests the connection to an existing datasource by its ID.
   * This endpoint validates that the stored datasource configuration can establish a connection.
   *
   * @param id - The unique identifier of the datasource to test
   * @returns A promise that resolves to an object containing success status and message
   * @throws {NotFoundException} When no datasource exists with the provided ID
   */
  @Post(':id/test')
  async testConnection(@Param('id') id: string) {
    const canConnect = await this.datasourcesService.testConnectionById(id);
    return {
      success: canConnect,
      message: canConnect ? 'Connection successful' : 'Connection failed',
    };
  }
}
