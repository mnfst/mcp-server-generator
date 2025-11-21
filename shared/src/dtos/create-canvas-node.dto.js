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
exports.CreateCanvasNodeDto = void 0;
const class_validator_1 = require("class-validator");
const canvas_node_type_enum_1 = require("../enums/canvas-node-type.enum");
/**
 * Data Transfer Object for creating a new canvas node.
 *
 * Canvas nodes represent visual elements in the workflow canvas that can be
 * datasources, MCP servers, tools, or add buttons. Each node has a position
 * and may reference a specific entity based on its type.
 *
 * @example
 * ```typescript
 * // Create a datasource node
 * const datasourceNode: CreateCanvasNodeDto = {
 *   nodeId: 'node-123',
 *   type: 'datasource',
 *   positionX: 100,
 *   positionY: 200,
 *   datasourceId: '123e4567-e89b-12d3-a456-426614174000'
 * };
 *
 * // Create an MCP server node
 * const mcpNode: CreateCanvasNodeDto = {
 *   nodeId: 'node-456',
 *   type: 'mcpServer',
 *   positionX: 300,
 *   positionY: 200,
 *   mcpServerId: '789e4567-e89b-12d3-a456-426614174000'
 * };
 * ```
 */
class CreateCanvasNodeDto {
    /**
     * Unique identifier for the canvas node.
     * Used to track and reference the node within the canvas.
     *
     * @example 'node-123' | 'datasource-node-abc'
     */
    nodeId;
    /**
     * The type of entity this canvas node represents.
     *
     * - DATASOURCE: A database connection node
     * - MCP_SERVER: An MCP server instance node
     * - TOOL: A tool or function node
     * - ADD: A button node for adding new elements
     *
     * @example CanvasNodeType.DATASOURCE | CanvasNodeType.MCP_SERVER
     */
    type;
    /**
     * The horizontal position of the node on the canvas.
     * Measured in pixels from the left edge.
     *
     * @example 100 | 250.5
     */
    positionX;
    /**
     * The vertical position of the node on the canvas.
     * Measured in pixels from the top edge.
     *
     * @example 200 | 350.25
     */
    positionY;
    /**
     * Reference to a datasource entity.
     * Required when type is 'datasource', otherwise should be undefined.
     *
     * @optional
     * @example '123e4567-e89b-12d3-a456-426614174000'
     */
    datasourceId;
    /**
     * Reference to an MCP server entity.
     * Required when type is 'mcpServer', otherwise should be undefined.
     *
     * @optional
     * @example '789e4567-e89b-12d3-a456-426614174000'
     */
    mcpServerId;
    /**
     * Reference to a tool entity.
     * Required when type is 'tool', otherwise should be undefined.
     *
     * @optional
     * @example 'abc12345-e89b-12d3-a456-426614174000'
     */
    toolId;
}
exports.CreateCanvasNodeDto = CreateCanvasNodeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCanvasNodeDto.prototype, "nodeId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(canvas_node_type_enum_1.CanvasNodeType),
    __metadata("design:type", String)
], CreateCanvasNodeDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCanvasNodeDto.prototype, "positionX", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCanvasNodeDto.prototype, "positionY", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCanvasNodeDto.prototype, "datasourceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCanvasNodeDto.prototype, "mcpServerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCanvasNodeDto.prototype, "toolId", void 0);
//# sourceMappingURL=create-canvas-node.dto.js.map