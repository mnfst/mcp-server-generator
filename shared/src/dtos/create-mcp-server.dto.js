"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMCPServerDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Data Transfer Object for creating a new MCP (Model Context Protocol) server.
 *
 * This DTO defines the configuration needed to create an MCP server instance
 * that exposes datasource capabilities through the Model Context Protocol.
 * The server acts as a bridge between AI models and datasources.
 *
 * @example
 * ```typescript
 * const mcpServer: CreateMCPServerDto = {
 *   datasourceId: '123e4567-e89b-12d3-a456-426614174000',
 *   name: 'Production MySQL MCP',
 *   slug: 'prod-mysql-mcp',
 *   version: '1.0.0'
 * };
 * ```
 */
class CreateMCPServerDto {
    /**
     * The unique identifier of the datasource this MCP server will expose.
     * Must reference an existing datasource.
     *
     * @validation Must be a non-empty string
     * @example '123e4567-e89b-12d3-a456-426614174000'
     */
    datasourceId;
    /**
     * The human-readable name of the MCP server.
     * Used for display purposes in the UI and API responses.
     *
     * @validation Must be a non-empty string
     * @example 'Production MySQL MCP Server'
     */
    name;
    /**
     * A URL-friendly identifier for the MCP server.
     * Used in API routes and endpoints.
     *
     * @validation Must contain only lowercase letters, numbers, and hyphens
     * @validation Pattern: /^[a-z0-9-]+$/
     * @example 'prod-mysql-mcp' | 'analytics-db' | 'user-service-db'
     */
    slug;
    /**
     * The version identifier for the MCP server.
     * Optional field used for tracking server versions.
     *
     * @validation Must be a string if provided
     * @optional
     * @example '1.0.0' | 'v2.3.1' | 'latest'
     */
    version;
}
exports.CreateMCPServerDto = CreateMCPServerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMCPServerDto.prototype, "datasourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMCPServerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-z0-9-]+$/, {
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
    __metadata("design:type", String)
], CreateMCPServerDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMCPServerDto.prototype, "version", void 0);
//# sourceMappingURL=create-mcp-server.dto.js.map