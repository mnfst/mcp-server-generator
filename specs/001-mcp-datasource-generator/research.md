# Research: MCP Datasource Tool Generator

**Phase**: 0 (Outline & Research)
**Date**: 2025-11-20
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Research Areas

### 1. MCP TypeScript SDK Integration

**Question**: How to generate and manage MCP servers programmatically using the TypeScript SDK?

**Decision**: Use `@modelcontextprotocol/sdk` npm package to generate MCP server configurations. The SDK provides:
- Server class for creating MCP servers
- Tool registration APIs
- Built-in JSON-RPC transport handling
- TypeScript types for MCP protocol

**Rationale**: Official SDK ensures protocol compliance and reduces custom implementation. TypeScript support provides type safety for tool definitions.

**Alternatives Considered**:
- Manual JSON-RPC implementation → Rejected: reinventing the wheel, error-prone
- Python MCP SDK → Rejected: full stack is TypeScript, language switching adds complexity

**Implementation Approach**:
- Backend generates Node.js files with MCP SDK server initialization
- Tool definitions converted to MCP SDK tool registration calls
- Generated servers are standalone Node.js applications

### 2. Database Schema Introspection

**Question**: How to retrieve and parse database schemas from MySQL?

**Decision**: Use MySQL information schema:
- MySQL: `information_schema.TABLES`, `information_schema.COLUMNS`, `information_schema.KEY_COLUMN_USAGE`

**Rationale**: Information schema is standardized SQL-92 and supported by MySQL. No external dependencies needed beyond the database driver already required. PostgreSQL support deferred to future iteration.

**Alternatives Considered**:
- TypeORM schema introspection → Rejected: limited to entities, not full database metadata
- Third-party schema tools → Rejected: adds dependencies, overkill for read-only introspection
- Database CLI tools (mysqldump) → Rejected: requires shell execution, parsing complexity

**Implementation Approach**:
- Schema service queries information schema on demand
- Parses results into normalized schema representation (tables, columns, data types, relationships)
- Caches schema per datasource connection, invalidating on datasource changes or manual refresh

### 3. LLM Integration for SQL Generation

**Question**: Which LLM provider and how to structure prompts for SQL generation?

**Decision**: Use OpenAI API only (API key stored in .env file). Use structured prompts with:
- Database schema context (tables, columns, types)
- Example queries for MySQL
- Clear constraints (SELECT only, avoid dangerous operations)
- JSON response format for structured output including SQL query and parameter definitions

**Rationale**: OpenAI provides reliable SQL generation capabilities. Single provider simplifies POC implementation while still delivering core functionality. Structured prompts with schema context improve SQL quality. JSON output enables parsing and validation. Automatic parameter extraction from LLM reduces user burden.

**Alternatives Considered**:
- Multiple LLM providers → Rejected: adds complexity for POC, can be added later if needed
- Text-to-SQL specialized models → Rejected: requires hosting/deployment, overkill for POC
- Rule-based SQL generation → Rejected: limited capability, defeats purpose of natural language interface

**Implementation Approach**:
- Query generation service accepts datasource ID and natural language prompt
- Fetches MySQL schema from schema service
- Constructs LLM prompt with schema context and user prompt
- Calls OpenAI API with structured JSON response request
- Parses JSON response to extract SQL query and parameters
- Validates SQL syntax and SELECT-only constraint
- On LLM API failure, displays specific error message (network, rate limit, auth) with retry button

**Prompt Template**:
```
You are a SQL query generator. Given a database schema and a natural language request, generate a valid MySQL SELECT query with parameters.

Database Type: MySQL
Schema:
[Tables with columns and types]

User Request: [natural language prompt]

Requirements:
- Generate ONLY SELECT queries (no INSERT, UPDATE, DELETE)
- Use proper joins for relationships
- Return valid SQL for [database type]
- Respond in JSON: {"sql": "SELECT ...", "explanation": "..."}
```

### 4. React Flow Canvas for Workflow Visualization

**Question**: How to implement a node-based canvas interface for managing datasources, MCP servers, and tools?

**Decision**: Use React Flow v11 with custom node types for workflow visualization (NOT database schema):
- **DatasourceNode**: Displays datasource icon and name
- **MCPServerNode**: Displays MCP server icon and name
- **ToolNode**: Displays tool icon and name
- **AddNode**: Special "+" nodes for adding datasources/MCP servers
- **Edges**: Represent relationships (datasource→MCP server→tools)
- **Interactive features**: zoom, pan, node dragging
- **Persistence**: Node positions stored in MySQL database (canvas-node entity)
- **Auto-layout**: dagre layout algorithm for initial positioning of new nodes

**Rationale**: React Flow provides mature, performant node-based UI with built-in interactivity. Canvas visualizes the logical workflow (datasource→MCP server→tools hierarchy), NOT database schema (tables/columns). Database schema shown separately in simple table/list view in dialogs. Custom node types allow domain-specific rendering with minimal display (icon + name only). Position persistence ensures consistent layout across sessions.

**Alternatives Considered**:
- D3.js → Rejected: lower-level, more implementation work, no built-in interactivity
- Cytoscape.js → Rejected: graph-focused, less suited for hierarchical workflows
- Manual SVG → Rejected: reinventing the wheel, no zoom/pan/interaction built-in
- React Flow with complex node details → Rejected: clutters canvas, prefer minimal nodes + dialogs

**Implementation Approach**:
- **Frontend Canvas State**:
  - FlowCanvas.tsx manages React Flow instance with nodes and edges
  - Custom node components (DatasourceNode, MCPServerNode, ToolNode, AddNode) render minimal UI
  - Node click handlers open modal dialogs for details/actions
  - TanStack Query manages server state (node positions fetched/updated via API)
  - `onNodesChange` handler updates positions in backend on drag
- **Backend Canvas Module**:
  - `canvas.service.ts` manages CanvasNode entities (id, nodeId, type, position, datasourceId/mcpServerId/toolId)
  - Provides CRUD operations for node positions
  - Returns nodes grouped by type for frontend rendering
- **Auto-layout**:
  - Use dagre algorithm for initial positioning when new nodes created
  - User can drag nodes, positions saved to database
  - On reload, positions restored from database
- **Node Types**:
  - Datasource nodes: single "+" child node for "Create MCP Server"
  - MCP server nodes: clickable to open dialog with "Create Tool" and "View Schema" options
  - Tool nodes: clickable to open tool details dialog with Edit/Test/Delete actions
  - Add nodes: "+" nodes with labels ("Add Datasource", "Create MCP Server")
- **Modal Dialogs**: All data entry happens in shadcn/ui Dialog components, keeping canvas clean

### 5. Database Schema Display

**Question**: How should database schema (tables, columns, foreign keys) be displayed to users for reference when creating tools?

**Decision**: Simple table/list view in a modal dialog (separate from React Flow canvas):
- **Display Format**: Accordion or nested list showing tables with their columns
- **Information Shown**: Table names, column names, data types, foreign key relationships
- **Interaction**: Search/filter functionality to find specific tables or columns
- **Highlight**: When viewing a generated SQL query, highlight referenced tables/columns
- **Modal Context**: Shown in SchemaViewDialog.tsx when user clicks "View Schema" on MCP server node

**Rationale**: POC needs functional schema reference, not visual diagram. Simple table/list view is fastest to implement and meets user needs for understanding available data. Separating schema display from React Flow canvas keeps canvas clean and focused on workflow (datasource→MCP server→tools). Users need schema reference when creating tools, so displaying it in a dialog alongside tool creation makes sense.

**Alternatives Considered**:
- Schema diagram on React Flow canvas → Rejected: clutters canvas, mixes two different concerns (workflow vs data structure)
- Full-screen schema explorer → Rejected: over-engineering for POC, disrupts workflow
- No schema display → Rejected: users need to see available tables/columns when creating tools
- Interactive ER diagram → Rejected: complex implementation, unnecessary for POC

**Implementation Approach**:
- **SchemaListView.tsx Component**:
  - Fetches schema from `/api/schema/:datasourceId` endpoint
  - Renders tables as shadcn/ui Accordion items
  - Each table shows columns in a simple list with data types
  - Foreign keys indicated with arrow icon and target table name
  - Search input filters tables and columns
- **SchemaViewDialog.tsx**:
  - Modal dialog containing SchemaListView component
  - Opened from MCP server node "View Schema" action
  - Can be kept open alongside tool creation for reference
- **SQL Highlighting**:
  - When tool dialog shows generated SQL, parse table/column references
  - Pass highlighted table/column names to SchemaListView as props
  - Highlight matching items with background color

### 6. Monorepo Type Sharing

**Question**: How to share TypeScript types between frontend and backend without duplication?

**Decision**: Use npm workspaces with TypeScript project references:
- `shared/` package exports types and DTOs
- Backend references `shared` for entity validation
- Frontend references `shared` for API type safety
- TypeScript project references ensure build order

**Rationale**: Standard npm workspaces pattern. No build tools beyond TypeScript compiler. Ensures single source of truth for types.

**Alternatives Considered**:
- Duplicate types → Rejected: violates DRY, maintenance burden
- Code generation from OpenAPI → Rejected: overkill for simple POC, adds build complexity
- Monorepo tools (Nx, Turborepo) → Rejected: over-engineering for 3 packages

**Implementation Approach**:
- Root `package.json` defines workspaces: `["backend", "frontend", "shared"]`
- Shared exports types via `src/types/index.ts` and DTOs via `src/dtos/index.ts`
- Backend `package.json` includes `"shared": "workspace:*"` dependency
- Frontend `package.json` includes `"shared": "workspace:*"` dependency
- Each package has own `tsconfig.json` with appropriate project references

### 7. NestJS Best Practices for Modular Architecture

**Question**: How to structure NestJS modules for independent feature development?

**Decision**: Feature-based module organization:
- One module per feature domain (datasources, mcp-servers, tools, query-generation, schema)
- Each module contains: controller, service, entities, DTOs
- Modules import only what they need (minimize coupling)
- Shared concerns (database, config) in root module

**Rationale**: NestJS best practice for scalability. Aligns with constitutional modularity principle. Each module can be developed/tested independently.

**Alternatives Considered**:
- Single app module with all services → Rejected: tight coupling, hard to test independently
- Layer-based (controllers/, services/, entities/) → Rejected: splits related code, harder navigation

**Implementation Approach**:
- `datasources.module.ts` handles DB connection CRUD
- `mcp-servers.module.ts` imports datasources module, handles server generation
- `tools.module.ts` imports mcp-servers module, handles tool CRUD
- `query-generation.module.ts` is self-contained (LLM integration)
- `schema.module.ts` imports datasources module, handles introspection
- `canvas.module.ts` manages React Flow node positions (CanvasNode entity CRUD)

### 8. shadcn/ui Integration

**Question**: How to set up shadcn/ui in Vite React project?

**Decision**: Use shadcn/ui CLI to initialize and add components as needed:
- Run `npx shadcn-ui@latest init` in frontend directory
- Configure theme with Tailwind CSS
- Add components on-demand (`npx shadcn-ui@latest add button form card`)
- Components are copied to `src/components/ui/` (not npm package)

**Rationale**: shadcn/ui philosophy: copy components to your codebase for full control. Works well with Vite. Tailwind CSS provides utility-first styling.

**Alternatives Considered**:
- Material UI → Rejected: heavier, more opinionated, slower
- Ant Design → Rejected: requires less customization, larger bundle
- Custom components → Rejected: reinventing the wheel

**Implementation Approach**:
- Install shadcn/ui in frontend workspace
- Configure `components.json` for Vite paths
- Add components: Button, Card, Form, Input, Select, Dialog, Tabs
- Use Tailwind for custom styling beyond components

## Technical Decisions Summary

| Area | Decision | Key Dependency |
|------|----------|----------------|
| MCP Server | TypeScript SDK | `@modelcontextprotocol/sdk` |
| Schema Introspection | Information Schema SQL | Native database drivers |
| LLM Integration | OpenAI only | `openai` |
| Canvas Workflow Visualization | React Flow v11 (datasource→MCP→tools) | `reactflow`, `dagre` (auto-layout) |
| Database Schema Display | Simple table/list view in dialog | shadcn/ui Accordion |
| Canvas Node Persistence | MySQL database (CanvasNode entity) | TypeORM |
| Type Sharing | npm workspaces + TS project references | TypeScript 5.x |
| Backend Architecture | NestJS feature modules | `@nestjs/core`, `@nestjs/typeorm` |
| UI Components | shadcn/ui + Tailwind | `shadcn-ui`, `tailwindcss` |
| Database Drivers | mysql2 (MySQL only) | `mysql2` |
| Modal Dialogs | shadcn/ui Dialog | shadcn/ui components |

## Open Questions Resolved

All technical unknowns from Technical Context section have been resolved. No remaining NEEDS CLARIFICATION items.

## Next Steps

Proceed to Phase 1: Generate data-model.md, API contracts, and quickstart.md.
