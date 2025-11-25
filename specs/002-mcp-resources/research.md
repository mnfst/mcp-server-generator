# Research: MCP Server Resources

**Feature**: 002-mcp-resources
**Date**: 2025-11-25

## Research Questions

### 1. MCP Resources Protocol Implementation

**Question**: How should resources be exposed through the MCP protocol?

**Decision**: Implement `resources/list` and `resources/read` handlers in `MCPRuntimeService`, following the same pattern as existing `tools/list` and `tools/call` handlers.

**Rationale**:
- The MCP SDK provides `ListResourcesRequestSchema` and `ReadResourceRequestSchema` for handling resource requests
- Resources are a core MCP primitive alongside tools
- Existing pattern in `mcp-runtime.service.ts` already demonstrates handler registration
- Resources use a simpler request/response model than tools (no execution, just content retrieval)

**Alternatives Considered**:
- Separate MCP resource server: Rejected - adds unnecessary complexity
- Generic file server: Rejected - doesn't integrate with MCP protocol

**Sources**: [MCP Resources Specification](https://modelcontextprotocol.info/specification/2024-11-05/server/resources/)

### 2. Resource Content Delivery

**Question**: How should file content be returned for text vs binary files?

**Decision**: Use `text` property for text MIME types, `blob` (base64) for binary files.

**Rationale**:
- MCP spec defines two content representations: `text` (string) and `blob` (base64)
- Text files (text/*, application/json, etc.) should be returned as plain text for readability
- Binary files (images, PDFs, etc.) must be base64-encoded in the `blob` property
- MIME type detection via file extension or stored metadata

**Implementation**:
```typescript
// Pseudo-code for content delivery
if (isTextMimeType(resource.mimeType)) {
  return { uri, mimeType, text: fileContent };
} else {
  return { uri, mimeType, blob: base64Encode(fileContent) };
}
```

**Alternatives Considered**:
- Always base64: Rejected - inefficient for text content, harder to debug
- External URL: Rejected - requires separate file serving infrastructure

### 3. File Upload Handling in NestJS

**Question**: What's the best approach for file uploads in NestJS?

**Decision**: Use `@nestjs/platform-express` with Multer for multipart file uploads.

**Rationale**:
- NestJS has built-in support via `@UseInterceptors(FileInterceptor())` decorator
- Multer is the standard Node.js multipart middleware
- Provides file size limits, file filtering, and storage configuration
- Already available in NestJS without additional dependencies

**Implementation Pattern**:
```typescript
@Post()
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  storage: diskStorage({
    destination: './public/storage',
    filename: (req, file, cb) => cb(null, `${uuid()}-${file.originalname}`)
  })
}))
async create(
  @UploadedFile() file: Express.Multer.File,
  @Body() createResourceDto: CreateResourceDto
) { ... }
```

**Alternatives Considered**:
- Raw body parsing: Rejected - no file validation, harder to work with
- External upload service (S3): Rejected - over-engineering for POC

### 4. Resource URI Scheme

**Question**: What URI scheme should resources use for MCP protocol?

**Decision**: Use custom `resource://` scheme with format `resource://{mcpServerId}/{resourceId}`.

**Rationale**:
- MCP spec allows custom URI schemes
- Clear identification that this is an application-managed resource
- Includes MCP server scope to avoid collisions
- Easy to parse for routing in `resources/read` handler

**Examples**:
- `resource://abc123-mcp-id/def456-resource-id`
- Parsed: `{ mcpServerId: 'abc123-mcp-id', resourceId: 'def456-resource-id' }`

**Alternatives Considered**:
- `file://` scheme: Rejected - implies filesystem path exposure, security concerns
- `https://` scheme: Rejected - implies external URL, not appropriate for internal resources

### 5. Unique Filename Generation

**Question**: How to handle filename collisions in storage?

**Decision**: Prefix original filename with UUID: `{uuid}-{originalFilename}`.

**Rationale**:
- Guarantees uniqueness without complex collision detection
- Preserves original filename for display purposes
- UUID generated at upload time, stored in database
- Simple implementation with `crypto.randomUUID()` or `uuid` package

**Database Fields**:
- `filename`: UUID-prefixed stored filename (e.g., `abc123-report.pdf`)
- `originalFilename`: User's original filename (e.g., `report.pdf`)

**Alternatives Considered**:
- Hash-based naming: Rejected - loses original filename context
- Counter suffix: Rejected - requires collision checking, race condition risk

### 6. Server Capability Declaration

**Question**: How to declare resource support in MCP server?

**Decision**: Add `resources: {}` to server capabilities in `startServer()`.

**Rationale**:
- MCP servers must declare supported capabilities
- Empty object indicates basic resource support (no subscription/listChanged for POC)
- Clients use this to determine available features

**Implementation**:
```typescript
const server = new Server(
  { name, version },
  {
    capabilities: {
      tools: {},
      resources: {},  // ADD THIS
    },
  },
);
```

### 7. Cascade Delete Behavior

**Question**: How should resources be handled when parent MCP server is deleted?

**Decision**: Cascade delete resources when MCP server is deleted, including file cleanup.

**Rationale**:
- FR-008 requires cascade delete for resources
- Consistent with existing pattern (tools check prevents MCP server delete)
- Resources are strongly owned by MCP server, no independent existence
- File system cleanup must accompany database record deletion

**Implementation**:
1. Before MCP server delete, query all resources
2. Delete stored files from filesystem
3. Delete resource database records
4. Proceed with MCP server deletion

**Alternatives Considered**:
- Block delete if resources exist (like tools): Rejected - per spec, cascade is required
- Soft delete: Rejected - over-engineering for POC

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| File upload | Multer via @nestjs/platform-express | Standard NestJS pattern, built-in |
| Storage location | `./public/storage/` | Simple filesystem, POC scope |
| Filename strategy | UUID prefix | Guarantees uniqueness |
| URI scheme | `resource://{mcpServerId}/{resourceId}` | Custom scheme, clear scoping |
| Content encoding | text for text/*, blob for binary | MCP spec compliant |
| Cascade delete | Yes, with file cleanup | Per FR-008 requirement |
| MCP handlers | ListResourcesRequestSchema, ReadResourceRequestSchema | SDK-provided schemas |

## No Outstanding Clarifications

All technical decisions have been resolved. Ready for Phase 1: Design & Contracts.
