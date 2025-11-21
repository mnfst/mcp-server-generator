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
exports.UpdateCanvasNodeDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Data Transfer Object for updating an existing canvas node.
 *
 * This DTO allows partial updates to canvas node positions.
 * All fields are optional, allowing clients to update only the properties they need to change.
 * Typically used when dragging nodes around the canvas.
 *
 * @example
 * ```typescript
 * // Update both coordinates
 * const update: UpdateCanvasNodeDto = {
 *   positionX: 150,
 *   positionY: 250
 * };
 *
 * // Update only horizontal position
 * const horizontalUpdate: UpdateCanvasNodeDto = {
 *   positionX: 200
 * };
 *
 * // Update only vertical position
 * const verticalUpdate: UpdateCanvasNodeDto = {
 *   positionY: 300
 * };
 * ```
 */
class UpdateCanvasNodeDto {
    /**
     * The new horizontal position of the node on the canvas.
     * Measured in pixels from the left edge.
     *
     * @optional Only include if the horizontal position needs to be updated
     * @example 150 | 275.5
     */
    positionX;
    /**
     * The new vertical position of the node on the canvas.
     * Measured in pixels from the top edge.
     *
     * @optional Only include if the vertical position needs to be updated
     * @example 250 | 425.75
     */
    positionY;
}
exports.UpdateCanvasNodeDto = UpdateCanvasNodeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCanvasNodeDto.prototype, "positionX", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCanvasNodeDto.prototype, "positionY", void 0);
//# sourceMappingURL=update-canvas-node.dto.js.map