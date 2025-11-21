"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasNodeType = void 0;
/**
 * Enum representing the possible types of canvas nodes.
 *
 * - DATASOURCE: A database connection node
 * - MCP_SERVER: An MCP server instance node
 * - TOOL: A tool or function node
 * - ADD: A button node for adding new elements
 */
var CanvasNodeType;
(function (CanvasNodeType) {
    /**
     * A database connection node.
     */
    CanvasNodeType["DATASOURCE"] = "datasource";
    /**
     * An MCP server instance node.
     */
    CanvasNodeType["MCP_SERVER"] = "mcpServer";
    /**
     * A tool or function node.
     */
    CanvasNodeType["TOOL"] = "tool";
    /**
     * A button node for adding new elements.
     */
    CanvasNodeType["ADD"] = "add";
})(CanvasNodeType || (exports.CanvasNodeType = CanvasNodeType = {}));
//# sourceMappingURL=canvas-node-type.enum.js.map