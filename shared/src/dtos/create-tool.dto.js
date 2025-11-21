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
exports.CreateToolDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Data Transfer Object for creating a new tool.
 * Used to validate incoming requests for tool creation.
 */
class CreateToolDto {
    /**
     * The MCP server ID this tool belongs to.
     * Must be a valid UUID of an existing MCP server.
     */
    mcpServerId;
    /**
     * Display name for the tool.
     * Must be unique within the MCP server.
     * Used in MCP protocol tool listings.
     */
    name;
    /**
     * Human-readable description of what the tool does.
     * Shown to users in tool listings and documentation.
     */
    description;
    /**
     * Natural language prompt describing the desired query.
     * Will be sent to OpenAI LLM to generate SQL query.
     *
     * Examples:
     * - "Get all active users from the last 30 days"
     * - "Find orders by customer ID with their total amount"
     * - "List top 10 products by sales volume"
     */
    prompt;
}
exports.CreateToolDto = CreateToolDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateToolDto.prototype, "mcpServerId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateToolDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateToolDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateToolDto.prototype, "prompt", void 0);
//# sourceMappingURL=create-tool.dto.js.map