import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createConnection } from 'mysql2/promise';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { Datasource } from './entities/datasource.entity';
import { CreateDatasourceDto, CanvasNodeType } from 'shared';
import { CanvasService } from '../canvas/canvas.service';

@Injectable()
export class DatasourcesService {
  private readonly algorithm = 'aes-256-ctr';
  private readonly key: Buffer;

  constructor(
    @InjectRepository(Datasource)
    private datasourceRepository: Repository<Datasource>,
    private canvasService: CanvasService,
  ) {
    // Derive encryption key from environment variable
    const encryptionKey = process.env.CREDENTIALS_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('CREDENTIALS_ENCRYPTION_KEY environment variable is required');
    }
    if (encryptionKey.length < 32) {
      throw new Error('CREDENTIALS_ENCRYPTION_KEY must be at least 32 characters long');
    }
    // Use a cryptographically secure salt derived from the key itself
    const salt = Buffer.from(encryptionKey.substring(0, 16));
    this.key = scryptSync(encryptionKey, salt, 32);
  }

  /**
   * Encrypts a plaintext string using AES-256-CTR encryption.
   *
   * @param text - The plaintext string to encrypt
   * @returns The encrypted string in the format "iv:encryptedData" (hex encoded)
   * @private
   */
  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypts an encrypted string that was encrypted using the encrypt method.
   *
   * @param text - The encrypted string in the format "iv:encryptedData" (hex encoded)
   * @returns The decrypted plaintext string
   * @private
   */
  private decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString();
  }

  /**
   * Tests the connection to a MySQL datasource with the provided credentials.
   *
   * @param datasource - The datasource configuration (can include either password or encryptedPassword)
   * @returns A promise that resolves to true if the connection is successful, false otherwise
   */
  async testConnection(datasource: Partial<Datasource> & { password?: string }): Promise<boolean> {
    try {
      const password = datasource.password || (datasource.encryptedPassword ? this.decrypt(datasource.encryptedPassword) : '');
      const connection = await createConnection({
        host: datasource.host!,
        port: datasource.port!,
        user: datasource.username!,
        password: password,
        database: datasource.database!,
      });
      await connection.end();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Creates a new datasource in the database and automatically creates a canvas node for it.
   * Tests the connection before saving and sets the status accordingly.
   *
   * @param createDatasourceDto - The datasource creation data
   * @returns A promise that resolves to the created datasource entity
   */
  async create(createDatasourceDto: CreateDatasourceDto): Promise<Datasource> {
    // Test connection before saving
    const canConnect = await this.testConnection(createDatasourceDto);

    const datasource = this.datasourceRepository.create({
      ...createDatasourceDto,
      encryptedPassword: this.encrypt(createDatasourceDto.password),
      status: canConnect ? 'connected' : 'error',
    });

    const savedDatasource = await this.datasourceRepository.save(datasource);

    // Automatically create a canvas node for this datasource
    await this.canvasService.create({
      nodeId: `datasource-${savedDatasource.id}`,
      type: CanvasNodeType.DATASOURCE,
      positionX: 100,
      positionY: 100,
      datasourceId: savedDatasource.id,
    });

    return savedDatasource;
  }

  /**
   * Retrieves all datasources from the database.
   *
   * @returns A promise that resolves to an array of all datasource entities
   */
  async findAll(): Promise<Datasource[]> {
    return this.datasourceRepository.find();
  }

  /**
   * Retrieves a single datasource by its ID.
   *
   * @param id - The unique identifier of the datasource
   * @returns A promise that resolves to the datasource entity
   * @throws {NotFoundException} If the datasource with the given ID is not found
   */
  async findOne(id: string): Promise<Datasource> {
    const datasource = await this.datasourceRepository.findOne({ where: { id } });
    if (!datasource) {
      throw new NotFoundException(`Datasource with ID ${id} not found`);
    }
    return datasource;
  }

  /**
   * Updates an existing datasource with new data.
   * Re-encrypts the password if it's being updated and retests the connection.
   *
   * @param id - The unique identifier of the datasource to update
   * @param updateData - The partial datasource data to update
   * @returns A promise that resolves to the updated datasource entity
   * @throws {NotFoundException} If the datasource with the given ID is not found
   */
  async update(id: string, updateData: Partial<CreateDatasourceDto>): Promise<Datasource> {
    const datasource = await this.findOne(id);

    // If password is being updated, re-encrypt it
    if (updateData.password) {
      datasource.encryptedPassword = this.encrypt(updateData.password);
    }

    // Update other fields
    Object.assign(datasource, updateData);

    // Retest connection
    const canConnect = await this.testConnection({
      ...datasource,
      password: updateData.password
    });
    datasource.status = canConnect ? 'connected' : 'error';

    return this.datasourceRepository.save(datasource);
  }

  /**
   * Deletes a datasource from the database.
   *
   * @param id - The unique identifier of the datasource to delete
   * @returns A promise that resolves when the datasource is successfully deleted
   * @throws {NotFoundException} If the datasource with the given ID is not found
   */
  async delete(id: string): Promise<void> {
    const result = await this.datasourceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Datasource with ID ${id} not found`);
    }
  }

  /**
   * Tests the connection to an existing datasource by its ID and updates its status.
   *
   * @param id - The unique identifier of the datasource to test
   * @returns A promise that resolves to true if the connection is successful, false otherwise
   * @throws {NotFoundException} If the datasource with the given ID is not found
   */
  async testConnectionById(id: string): Promise<boolean> {
    const datasource = await this.findOne(id);
    const canConnect = await this.testConnection(datasource);

    // Update status based on test result
    datasource.status = canConnect ? 'connected' : 'error';
    await this.datasourceRepository.save(datasource);

    return canConnect;
  }
}
