"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServerStatus = void 0;
/**
 * Enum representing the possible statuses of an MCP server.
 *
 * - draft: Server is configured but not yet activated
 * - active: Server is running and operational
 * - error: Server encountered an error during activation or operation
 */
var MCPServerStatus;
(function (MCPServerStatus) {
    /**
     * Server is configured but not yet activated.
     * In this state, the server exists in the database but is not serving requests.
     */
    MCPServerStatus["DRAFT"] = "draft";
    /**
     * Server is active and operational.
     * The server is running and can handle MCP requests.
     */
    MCPServerStatus["ACTIVE"] = "active";
    /**
     * Server encountered an error.
     * This could be due to configuration issues, connection problems, or runtime errors.
     */
    MCPServerStatus["ERROR"] = "error";
})(MCPServerStatus || (exports.MCPServerStatus = MCPServerStatus = {}));
//# sourceMappingURL=mcp-server-status.enum.js.map