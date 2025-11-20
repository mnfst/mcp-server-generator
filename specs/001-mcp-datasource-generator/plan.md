# Implementation Plan: MCP Datasource Tool Generator

**Branch**: `001-mcp-datasource-generator` | **Date**: 2025-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mcp-datasource-generator/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a visual canvas-based application using React Flow that enables users to connect MySQL databases and generate MCP servers with custom tools through an intuitive node-based interface. Users start with a "+" node to add datasources, then create connected MCP server nodes, and finally create tool nodes through modal dialogs. Tools are defined using natural language prompts that an LLM (OpenAI) converts to MySQL queries. The application uses a React Flow canvas for visualizing the datasource→MCP server→tools hierarchy, with modal dialogs for data entry and a simple table/list view for database schema inspection. MCP servers are served dynamically at `/mcp/:serverSlug` endpoints within the backend application. The full-stack TypeScript application uses React with shadcn/ui and React Flow for the frontend, NestJS with TypeORM for the backend, and follows a monorepo structure with shared types.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20.x LTS)
**Primary Dependencies**:
- Frontend: React 18, shadcn/ui, React Flow, TanStack Query, Vite
- Backend: NestJS 10, TypeORM, class-validator, class-transformer, MCP TypeScript SDK, OpenAI SDK
- Shared: TypeScript project references for type sharing
**Storage**: MySQL 8.0 (for application data: datasources, MCP configs, tools, canvas node positions)
**Testing**: Vitest (frontend), Jest (backend), React Testing Library
**Target Platform**: Web application (desktop browsers: Chrome, Firefox, Safari)
**Project Type**: Web (monorepo with frontend/ and backend/ plus shared/)
**Performance Goals**:
- React Flow canvas renders <1s for 50 nodes
- LLM query generation <30s total latency
- Tool testing query execution <2s
- MCP server response time <2s
**Constraints**:
- POC scope: no authentication, minimal security hardening
- Read-only SQL queries (SELECT only)
- Local development and deployment
- Single user context (no multi-tenancy)
- MySQL only (PostgreSQL deferred)
- OpenAI only (Anthropic deferred)
**Scale/Scope**:
- Support MySQL database type only
- Handle schemas up to 100 tables
- Support up to 50 tools per MCP server
- Support multiple datasources on canvas simultaneously
- Desktop browser UI only (no mobile optimization)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Modularity First ✅

**Status**: PASS

- Database connection logic isolated in datasources module
- MCP server generation as independent service
- LLM integration abstracted behind query generation interface
- React Flow canvas component decoupled from data fetching
- Tool management separate from query execution
- Frontend components modular (canvas, dialogs, node types)
- Modal dialogs for data entry separate from canvas display

**Justification**: Each capability (connect DB, generate server, create tools, visualize canvas) can be developed and tested independently.

### II. Code Quality Standards ✅

**Status**: PASS

- TypeScript provides type safety and self-documenting code
- Monorepo structure keeps related code together without premature abstraction
- Shared types prevent duplication without complexity
- Using established frameworks (React, NestJS, React Flow) avoids reinventing wheels
- Direct DTO validation with class-validator (simple, standard approach)
- No custom abstractions planned—using framework patterns
- React Flow provides node-based UI without custom graph library

**Justification**: Following framework conventions and YAGNI—building only what's needed for the three user stories. Using React Flow library instead of building custom canvas from scratch.

### III. Documentation as Code ✅

**Status**: PASS

- Specification defines WHY (enable SQL-free tool creation via canvas UI), WHAT (visual MCP server generator with React Flow), and HOW (node-based workflow with dialogs)
- Implementation plan documents technical decisions
- Data model will document entities, relationships, and canvas node positions
- API contracts will document all endpoints including node position management
- Quickstart will provide setup and canvas workflow instructions
- Inline documentation required for complex functions (>20 lines)

**Justification**: All required documentation artifacts will be created during planning phase.

### IV. Incremental Delivery ✅

**Status**: PASS

- P1: Connect database + generate MCP server via React Flow canvas (MVP - foundational capability)
- P2: Create tools via natural language + schema list view (core value)
- P3: Manage/edit tools via canvas nodes (enhancement, not required for initial value)
- Each story independently testable and deployable
- Can stop after P1 and have working canvas-based MCP server generator
- Can stop after P2 and have full value proposition

**Justification**: User stories structured for independent delivery with clear priority order. React Flow canvas provides immediate visual feedback at each stage.

### V. Specification-Driven Development ✅

**Status**: PASS (in progress)

- Specification completed with user stories, requirements, success criteria, and UI flow
- Implementation plan in progress (this document)
- Phase 0: Research will resolve any technical unknowns (React Flow patterns)
- Phase 1: Will produce data-model.md, contracts/, quickstart.md
- No code will be written until all design artifacts complete

**Justification**: Following Speckit workflow—currently in planning phase, implementation blocked until design complete.

### Gate Decision: **PROCEED TO PHASE 0** ✅

All constitutional principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-mcp-datasource-generator/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Monorepo structure with shared types
backend/
├── src/
│   ├── datasources/           # Database connection management
│   │   ├── datasources.module.ts
│   │   ├── datasources.controller.ts
│   │   ├── datasources.service.ts
│   │   └── entities/
│   │       └── datasource.entity.ts
│   ├── mcp-servers/           # MCP server generation and serving
│   │   ├── mcp-servers.module.ts
│   │   ├── mcp-servers.controller.ts
│   │   ├── mcp-servers.service.ts
│   │   ├── mcp-runtime.service.ts  # Dynamic server serving at /mcp/:slug
│   │   └── entities/
│   │       └── mcp-server.entity.ts
│   ├── tools/                 # Tool management
│   │   ├── tools.module.ts
│   │   ├── tools.controller.ts
│   │   ├── tools.service.ts
│   │   └── entities/
│   │       └── tool.entity.ts
│   ├── query-generation/      # OpenAI LLM integration
│   │   ├── query-generation.module.ts
│   │   └── query-generation.service.ts
│   ├── schema/                # MySQL schema introspection
│   │   ├── schema.module.ts
│   │   ├── schema.controller.ts
│   │   └── schema.service.ts
│   ├── canvas/                # React Flow node position management
│   │   ├── canvas.module.ts
│   │   ├── canvas.controller.ts
│   │   ├── canvas.service.ts
│   │   └── entities/
│   │       └── canvas-node.entity.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── integration/
│   └── unit/
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── canvas/            # React Flow canvas and nodes
│   │   │   ├── FlowCanvas.tsx
│   │   │   ├── DatasourceNode.tsx
│   │   │   ├── MCPServerNode.tsx
│   │   │   ├── ToolNode.tsx
│   │   │   └── AddNode.tsx   # "+" nodes
│   │   ├── dialogs/           # Modal dialogs
│   │   │   ├── DatasourceDialog.tsx
│   │   │   ├── MCPServerDialog.tsx
│   │   │   ├── ToolDialog.tsx
│   │   │   └── SchemaViewDialog.tsx
│   │   └── schema/            # Database schema list view
│   │       └── SchemaListView.tsx
│   ├── pages/
│   │   └── CanvasPage.tsx    # Main canvas page
│   ├── services/
│   │   ├── api.ts             # API client with TanStack Query
│   │   └── types.ts           # Re-exports from shared
│   ├── App.tsx
│   └── main.tsx
├── test/
│   └── components/
├── package.json
└── tsconfig.json

shared/
├── src/
│   ├── types/
│   │   ├── datasource.types.ts
│   │   ├── schema.types.ts
│   │   ├── tool.types.ts
│   │   ├── mcp-server.types.ts
│   │   ├── canvas-node.types.ts  # React Flow node position types
│   │   └── index.ts
│   └── dtos/
│       ├── create-datasource.dto.ts
│       ├── create-tool.dto.ts
│       ├── update-canvas-node.dto.ts
│       └── index.ts
├── package.json
└── tsconfig.json

# Root level
package.json                    # Workspace config
tsconfig.base.json              # Shared TS config
.env.example                    # Environment template
docker-compose.yml              # MySQL for development
```

**Structure Decision**: Monorepo with three packages (backend, frontend, shared) using npm workspaces. The backend uses NestJS modular architecture with feature-based modules (datasources, mcp-servers, tools, query-generation, schema, canvas). Frontend uses React Flow canvas as the primary UI with modal dialogs for data entry and a single-page application structure. Shared package contains TypeScript types and DTOs used by both frontend and backend, using TypeScript project references for type safety. The canvas module manages React Flow node positions for persistence across sessions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All constitutional principles satisfied.

## Phase 1 Complete - Constitution Re-Check

### Re-evaluation After Design Phase

All design artifacts have been completed:
- ✅ research.md: All technical decisions documented with rationale
- ✅ data-model.md: Entities, relationships, validation rules, canvas node positions defined
- ✅ contracts/: All API endpoints documented (datasources, mcp-servers, tools, schema, canvas)
- ✅ quickstart.md: Setup and React Flow canvas workflow guide completed
- ✅ CLAUDE.md: Agent context updated with technology stack

### Constitution Compliance Review

**I. Modularity First** ✅ **PASS**
- Confirmed in design: Each backend module (datasources, mcp-servers, tools, query-generation, schema, canvas) is independent
- Frontend components organized by feature domain (canvas, dialogs, schema)
- React Flow canvas component decoupled from business logic
- Shared types package enables type safety without coupling
- API contracts demonstrate clear boundaries between services

**II. Code Quality Standards** ✅ **PASS**
- TypeScript enforces type safety and self-documenting code
- No custom abstractions introduced—using NestJS, React, and React Flow patterns
- Simple, direct implementations planned (no over-engineering)
- DTOs use class-validator (standard, simple validation)
- React Flow provides node management without custom graph logic

**III. Documentation as Code** ✅ **PASS**
- WHY: Documented in spec and research (enable SQL-free tool creation via visual canvas)
- WHAT: Data model and contracts define all capabilities including canvas node management
- HOW: Quickstart provides step-by-step setup and React Flow canvas workflow
- All design artifacts complete and understandable

**IV. Incremental Delivery** ✅ **PASS**
- P1 (Connect DB + Generate Server via Canvas): Independently deliverable MVP
- P2 (Create Tools + Schema View): Builds on P1, independent value
- P3 (Manage Tools): Enhancement layer, optional
- Project structure supports feature-based development

**V. Specification-Driven Development** ✅ **PASS**
- All required artifacts completed before implementation
- Understanding checkpoint met: Can explain purpose, user stories, entities, canvas workflow, and approach
- No code written yet—blocking on design completion per constitution
- Ready to proceed to task generation (`/speckit.tasks`)

### Final Gate Decision: **READY FOR IMPLEMENTATION** ✅

All constitutional principles remain satisfied after design phase. No violations. Proceed to task generation and implementation.
