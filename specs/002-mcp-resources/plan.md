# Implementation Plan: MCP Server Resources

**Branch**: `002-mcp-resources` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-mcp-resources/spec.md`

## Summary

Add file resource support to MCP servers, enabling users to upload files through a dialog interface and expose them to AI assistants via the MCP resources protocol. Resources appear as visual nodes on the canvas connected to their parent MCP server, following the same patterns as existing tool nodes.

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js >= 20.0.0
**Primary Dependencies**: NestJS 10.3.0, TypeORM 0.3.19, React 18.2.0, React Flow 11.10.4, @modelcontextprotocol/sdk 0.5.0
**Storage**: MySQL (TypeORM), File system (`backend/public/storage/` for uploaded files)
**Testing**: Jest 29.7.0 (backend), Vitest 1.2.0 (frontend)
**Target Platform**: Web application (backend port 3001, frontend via Vite)
**Project Type**: Web (frontend + backend monorepo with shared package)
**Performance Goals**: File uploads up to 10MB without timeout (per FR-009)
**Constraints**: POC scope - no authentication, local file storage, read-only resources
**Scale/Scope**: Single-user POC, typical use case 5-20 resources per MCP server

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modularity First | ✅ PASS | Resource feature isolated in new module; follows existing patterns (datasources, tools) |
| II. Code Quality - Simplicity | ✅ PASS | No over-engineering; follows existing service/controller/entity patterns |
| II. Code Quality - Understandability | ✅ PASS | Follows established naming conventions; clear separation of concerns |
| III. Documentation as Code | ✅ PASS | This plan + spec.md + data-model.md + contracts/ will be complete |
| IV. Incremental Delivery | ✅ PASS | 3 user stories with P1/P2/P3 priorities; each independently testable |
| V. Specification-Driven Development | ✅ PASS | Spec complete before planning; design artifacts in progress |

**Gate Status**: PASS - No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/002-mcp-resources/
├── plan.md              # This file
├── spec.md              # Feature specification (complete)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── resources-api.yaml
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── resources/                 # NEW: Resource module
│   │   ├── resources.module.ts
│   │   ├── resources.controller.ts
│   │   ├── resources.service.ts
│   │   └── entities/
│   │       └── resource.entity.ts
│   ├── mcp-servers/
│   │   └── mcp-runtime.service.ts # MODIFY: Add resources/list, resources/read handlers
│   ├── dtos/
│   │   └── create-resource.dto.ts # NEW: Validation DTO
│   └── canvas/
│       └── entities/
│           └── canvas-node.entity.ts # MODIFY: Add resourceId relation
├── public/
│   └── storage/                   # NEW: Uploaded files directory
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── ResourceNode.tsx   # NEW: Resource node component
│   │   │   └── FlowCanvas.tsx     # MODIFY: Add resource handling
│   │   └── dialogs/
│   │       └── AddResourceDialog.tsx # NEW: Resource creation dialog
│   └── services/
│       └── resources.ts           # NEW: API service (optional, may use inline fetch)
└── tests/

shared/
└── src/
    ├── types/
    │   └── index.ts               # MODIFY: Add Resource type
    └── enums/
        └── index.ts               # MODIFY: Add RESOURCE to CanvasNodeType
```

**Structure Decision**: Follows existing web application pattern with backend/frontend/shared packages. New Resource module mirrors existing Tool module structure for consistency.

## Complexity Tracking

> No violations requiring justification. Feature follows established patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |
