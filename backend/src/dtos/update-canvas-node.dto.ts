import { IsNumber, IsOptional } from 'class-validator';

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
export class UpdateCanvasNodeDto {
  /**
   * The new horizontal position of the node on the canvas.
   * Measured in pixels from the left edge.
   *
   * @optional Only include if the horizontal position needs to be updated
   * @example 150 | 275.5
   */
  @IsOptional()
  @IsNumber()
  positionX?: number;

  /**
   * The new vertical position of the node on the canvas.
   * Measured in pixels from the top edge.
   *
   * @optional Only include if the vertical position needs to be updated
   * @example 250 | 425.75
   */
  @IsOptional()
  @IsNumber()
  positionY?: number;
}
