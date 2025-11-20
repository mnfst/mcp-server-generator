# Tasks: MCP Datasource Tool Generator

**Input**: Design documents from `/specs/001-mcp-datasource-generator/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT requested in the specification. This tasks list focuses on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `shared/src/`
- Monorepo structure with npm workspaces

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic monorepo structure

- [x] T001 Create monorepo structure with backend/, frontend/, shared/ directories
- [x] T002 Initialize root package.json with npm workspaces configuration for backend, frontend, and shared packages
- [x] T003 [P] Create tsconfig.base.json in repository root with shared TypeScript compiler options
- [x] T004 [P] Create .env.example in repository root with environment variable templates (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, CREDENTIALS_ENCRYPTION_KEY, OPENAI_API_KEY, BACKEND_PORT, FRONTEND_PORT)
- [x] T005 [P] Create docker-compose.yml in repository root for MySQL 8.0 development database
- [x] T006 Initialize backend package with NestJS 10, TypeORM, class-validator, class-transformer, @modelcontextprotocol/sdk, openai dependencies in backend/package.json
- [x] T007 [P] Initialize frontend package with React 18, Vite, React Flow, TanStack Query, Tailwind CSS dependencies in frontend/package.json
- [x] T008 [P] Initialize shared package with TypeScript 5.x in shared/package.json
- [x] T009 [P] Create backend/tsconfig.json with project references to shared package
- [x] T010 [P] Create frontend/tsconfig.json with project references to shared package and Vite configuration
- [x] T011 [P] Create shared/tsconfig.json for shared types and DTOs
- [x] T012 [P] Setup shadcn/ui in frontend/ using CLI (npx shadcn-ui@latest init) with Tailwind CSS configuration
- [x] T013 [P] Add shadcn/ui components needed: Button, Card, Form, Input, Select, Dialog, Tabs, Accordion in frontend/src/components/ui/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T014 Create backend/src/main.ts with NestJS bootstrap configuration (port 3001, CORS enabled, global validation pipe)
- [x] T015 Create backend/src/app.module.ts with TypeORM configuration for MySQL (host, port, username, password, database from environment variables, synchronize: true for development)
- [x] T016 [P] Create shared/src/types/index.ts as main export file for all shared types
- [x] T017 [P] Create shared/src/dtos/index.ts as main export file for all DTOs
- [x] T018 [P] Create frontend/src/main.tsx with React root rendering and TanStack Query provider setup
- [x] T019 [P] Create frontend/src/App.tsx with basic routing structure (single-page canvas application)
- [x] T020 [P] Create frontend/src/services/api.ts with TanStack Query configuration and base API client (axios or fetch with base URL: http://localhost:3001)
- [x] T021 [P] Create frontend/src/services/types.ts that re-exports types from shared package
- [x] T022 [P] Install and configure dagre layout library in frontend/ for React Flow auto-layout (npm install dagre @types/dagre)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Connect Database and Generate MCP Server (Priority: P1) 🎯 MVP

**Goal**: Enable users to connect a MySQL database via React Flow canvas and generate a functional MCP server accessible at /mcp/:serverSlug endpoint. Users interact with "+" nodes and dialogs to create datasource and MCP server nodes on the canvas.

**Independent Test**: Connect a sample MySQL database with a test schema, generate the MCP server via canvas workflow, and verify the server is accessible at /mcp/:serverSlug and responds to MCP protocol requests with an empty tools list.

### Backend: Shared Types & DTOs (US1)

- [x] T023 [P] [US1] Create shared/src/types/datasource.types.ts with Datasource interface (id, name, type, host, port, database, username, status, createdAt, updatedAt)
- [x] T024 [P] [US1] Create shared/src/types/mcp-server.types.ts with MCPServer interface (id, name, slug, datasourceId, config, status, mcpEndpoint, createdAt, updatedAt)
- [x] T025 [P] [US1] Create shared/src/types/canvas-node.types.ts with CanvasNode interface (id, nodeId, type, positionX, positionY, datasourceId, mcpServerId, toolId, createdAt, updatedAt)
- [x] T026 [P] [US1] Create shared/src/dtos/create-datasource.dto.ts with validation rules (name, type='mysql', host, port, database, username, password)
- [x] T027 [P] [US1] Create shared/src/dtos/create-mcp-server.dto.ts with validation rules (datasourceId)
- [x] T028 [P] [US1] Create shared/src/dtos/create-canvas-node.dto.ts with validation rules (nodeId, type, positionX, positionY, datasourceId?, mcpServerId?, toolId?)
- [x] T029 [P] [US1] Create shared/src/dtos/update-canvas-node.dto.ts with validation rules (positionX?, positionY?)

### Backend: Datasources Module (US1)

- [x] T030 [P] [US1] Create backend/src/datasources/entities/datasource.entity.ts with TypeORM entity (uuid primary key, name unique, type='mysql', host, port, database, username, encrypted password, status enum, timestamps)
- [x] T031 [US1] Create backend/src/datasources/datasources.service.ts with methods: create (test connection, encrypt password, save), findAll, findOne, update (retest connection, re-encrypt password if changed), delete, testConnection (MySQL connection validation)
- [x] T032 [US1] Create backend/src/datasources/datasources.controller.ts with REST endpoints: POST /api/datasources (create), GET /api/datasources (list), GET /api/datasources/:id (get by ID), PATCH /api/datasources/:id (update), DELETE /api/datasources/:id (delete), POST /api/datasources/:id/test (test connection)
- [x] T033 [US1] Create backend/src/datasources/datasources.module.ts importing TypeOrmModule.forFeature([Datasource]), exporting DatasourcesService

### Backend: MCP Servers Module (US1)

- [x] T034 [P] [US1] Create backend/src/mcp-servers/entities/mcp-server.entity.ts with TypeORM entity (uuid primary key, name, slug unique, datasourceId foreign key, config JSON nullable, status enum='draft'|'active'|'error', timestamps)
- [x] T035 [US1] Create backend/src/mcp-servers/mcp-servers.service.ts with methods: create (generate slug from datasource name with conflict resolution, save), findAll, findOne, update (set status to 'draft'), delete, activate (start MCP server at /mcp/:slug endpoint)
- [x] T036 [US1] Create backend/src/mcp-servers/mcp-runtime.service.ts with methods: startServer (initialize MCP SDK Server, register at /mcp/:slug with JSON-RPC transport), stopServer, reloadAllServers (for backend startup), getServerStatus
- [x] T037 [US1] Create backend/src/mcp-servers/mcp-servers.controller.ts with REST endpoints: POST /api/mcp-servers (create), GET /api/mcp-servers (list with datasourceId filter), GET /api/mcp-servers/:id (get by ID), PATCH /api/mcp-servers/:id (update), DELETE /api/mcp-servers/:id (delete), POST /api/mcp-servers/:id/activate (activate server)
- [x] T038 [US1] Create backend/src/mcp-servers/mcp-servers.module.ts importing TypeOrmModule.forFeature([MCPServer]), DatasourcesModule, exporting MCPServersService and MCPRuntimeService
- [x] T039 [US1] Update backend/src/app.module.ts to import MCPServersModule and configure MCP protocol endpoint middleware for /mcp/:slug routes

### Backend: Canvas Module (US1)

- [x] T040 [P] [US1] Create backend/src/canvas/entities/canvas-node.entity.ts with TypeORM entity (uuid primary key, nodeId unique, type enum='datasource'|'mcpServer'|'tool'|'add', positionX, positionY, datasourceId nullable foreign key, mcpServerId nullable foreign key, toolId nullable foreign key, timestamps)
- [x] T041 [US1] Create backend/src/canvas/canvas.service.ts with methods: create, findAll, findByNodeId, findByEntity (datasourceId/mcpServerId/toolId), updatePosition, batchUpdatePositions, delete
- [x] T042 [US1] Create backend/src/canvas/canvas.controller.ts with REST endpoints: POST /api/canvas/nodes (create), GET /api/canvas/nodes (list all), GET /api/canvas/nodes/entity/:entityType/:entityId (get by entity), PATCH /api/canvas/nodes/:nodeId (update position), PATCH /api/canvas/nodes/batch (batch update positions), DELETE /api/canvas/nodes/:nodeId (delete)
- [x] T043 [US1] Create backend/src/canvas/canvas.module.ts importing TypeOrmModule.forFeature([CanvasNode]), exporting CanvasService

### Frontend: React Flow Canvas (US1)

- [ ] T044 [P] [US1] Create frontend/src/components/canvas/FlowCanvas.tsx with React Flow instance, nodes and edges state management, zoom/pan/drag handlers, onNodesChange handler to update positions via API, TanStack Query hooks for fetching nodes from /api/canvas/nodes
- [ ] T045 [P] [US1] Create frontend/src/components/canvas/AddNode.tsx custom React Flow node component displaying "+" icon with label ("Add Datasource" or "Create MCP Server"), onClick handler to open appropriate dialog
- [ ] T046 [P] [US1] Create frontend/src/components/canvas/DatasourceNode.tsx custom React Flow node component displaying datasource icon, name, and status, onClick handler to open datasource details (not implemented in US1)
- [ ] T047 [P] [US1] Create frontend/src/components/canvas/MCPServerNode.tsx custom React Flow node component displaying MCP server icon, name, and status, onClick handler to open MCP server menu dialog (not implemented in US1, placeholder for US2)

### Frontend: Dialogs (US1)

- [ ] T048 [P] [US1] Create frontend/src/components/dialogs/DatasourceDialog.tsx with shadcn/ui Dialog containing form fields (name, type='mysql' readonly, host, port, database, username, password), "Test Connection" button calling POST /api/datasources/:id/test, "Connect" button calling POST /api/datasources with validation, success callback to create canvas node
- [ ] T049 [P] [US1] Create frontend/src/components/dialogs/MCPServerDialog.tsx with shadcn/ui Dialog containing form field (name), "Create" button calling POST /api/mcp-servers with datasourceId, success callback to create canvas node and activate server via POST /api/mcp-servers/:id/activate

### Frontend: API Integration (US1)

- [ ] T050 [US1] Create TanStack Query mutation hooks in frontend/src/services/api.ts: useCreateDatasource, useTestDatasource, useCreateMCPServer, useActivateMCPServer, useCreateCanvasNode, useUpdateCanvasNodePosition
- [ ] T051 [US1] Create TanStack Query query hooks in frontend/src/services/api.ts: useCanvasNodes (GET /api/canvas/nodes), useDatasources (GET /api/datasources), useMCPServers (GET /api/mcp-servers)

### Frontend: Main Canvas Page (US1)

- [ ] T052 [US1] Create frontend/src/pages/CanvasPage.tsx as main application page containing FlowCanvas component, managing dialog open/close state, handling canvas node creation workflow (AddNode click → open dialog → create entity → create canvas node with dagre auto-layout → close dialog)
- [ ] T053 [US1] Update frontend/src/App.tsx to render CanvasPage as default route

### Integration & Canvas Workflow (US1)

- [ ] T054 [US1] Implement canvas workflow: initial "Add Datasource" AddNode rendered on empty canvas (nodeId: 'add-datasource', type: 'add', position via dagre)
- [ ] T055 [US1] Implement datasource creation workflow: AddNode click → DatasourceDialog opens → user enters credentials → test connection → create Datasource entity → create DatasourceNode canvas node (nodeId: 'datasource-{uuid}', type: 'datasource') → create AddNode for "Create MCP Server" connected to datasource (nodeId: 'add-mcpserver-{datasource-uuid}', type: 'add') → close dialog
- [ ] T056 [US1] Implement MCP server creation workflow: AddNode click → MCPServerDialog opens → user enters name → create MCPServer entity → activate server at /mcp/:slug → create MCPServerNode canvas node (nodeId: 'mcpserver-{uuid}', type: 'mcpServer') → close dialog
- [ ] T057 [US1] Implement backend startup auto-reload: update backend/src/main.ts to call MCPRuntimeService.reloadAllServers() on application bootstrap to restore all MCP servers from database

**Checkpoint**: At this point, User Story 1 should be fully functional - users can connect database via canvas, generate MCP server, and access it at /mcp/:serverSlug with empty tools list

---

## Phase 4: User Story 2 - Create SQL Query Tools Visually (Priority: P2)

**Goal**: Enable users to create custom tools for their MCP server by describing what data they want in natural language. The system uses OpenAI LLM to generate appropriate MySQL queries. Users can view database schema in a simple table/list view and test generated tools.

**Independent Test**: Load a generated MCP server from US1, describe a data need in natural language (e.g., "get all active users"), have the system generate SQL, view schema in table/list view, save tool, test tool execution, and verify tool appears on canvas and is accessible via MCP protocol.

### Backend: Shared Types & DTOs (US2)

- [ ] T058 [P] [US2] Create shared/src/types/tool.types.ts with Tool interface (id, name, description, mcpServerId, prompt, sqlQuery, parameters JSON, createdAt, updatedAt)
- [ ] T059 [P] [US2] Create shared/src/types/schema.types.ts with DatabaseSchema, Table, Column, ForeignKey interfaces for schema introspection results
- [ ] T060 [P] [US2] Create shared/src/dtos/create-tool.dto.ts with validation rules (mcpServerId, name, description, prompt)

### Backend: Query Generation Module (US2)

- [ ] T061 [P] [US2] Create backend/src/query-generation/query-generation.service.ts with method: generateQuery (accepts datasourceId and natural language prompt, fetches schema from SchemaService, constructs OpenAI prompt with schema context, calls OpenAI API with structured JSON response request, parses response for SQL query and parameters, validates SELECT-only constraint, returns query and parameters)
- [ ] T062 [P] [US2] Create backend/src/query-generation/query-generation.module.ts as standalone module exporting QueryGenerationService (no database dependencies)

### Backend: Schema Module (US2)

- [ ] T063 [P] [US2] Create backend/src/schema/schema.service.ts with methods: getSchema (query MySQL information_schema.TABLES, information_schema.COLUMNS, information_schema.KEY_COLUMN_USAGE for datasource, cache results in memory keyed by datasourceId), refreshSchema (invalidate cache and re-fetch), parseSchemaResults (transform information_schema rows to normalized DatabaseSchema type)
- [ ] T064 [P] [US2] Create backend/src/schema/schema.controller.ts with REST endpoints: GET /api/schema/:datasourceId (get schema), POST /api/schema/:datasourceId/refresh (refresh schema cache)
- [ ] T065 [P] [US2] Create backend/src/schema/schema.module.ts importing DatasourcesModule, exporting SchemaService

### Backend: Tools Module (US2)

- [ ] T066 [P] [US2] Create backend/src/tools/entities/tool.entity.ts with TypeORM entity (uuid primary key, name, description, mcpServerId foreign key, prompt text, sqlQuery text, parameters JSON nullable, timestamps, unique constraint on mcpServerId+name)
- [ ] T067 [US2] Create backend/src/tools/tools.service.ts with methods: create (validate name uniqueness within server, save tool, update MCP server status to 'draft'), findAll (with mcpServerId filter), findOne, update (regenerate SQL if prompt changed, update MCP server status to 'draft'), delete, testTool (execute SQL query with parameter values, return first 10 rows with execution time)
- [ ] T068 [US2] Create backend/src/tools/tools.controller.ts with REST endpoints: POST /api/tools (create - calls QueryGenerationService.generateQuery then saves tool), GET /api/tools (list with mcpServerId filter), GET /api/tools/:id (get by ID), PATCH /api/tools/:id (update), DELETE /api/tools/:id (delete), POST /api/tools/:id/test (test tool with parameters)
- [ ] T069 [US2] Create backend/src/tools/tools.module.ts importing TypeOrmModule.forFeature([Tool]), MCPServersModule, QueryGenerationModule, DatasourcesModule, exporting ToolsService
- [ ] T070 [US2] Update backend/src/mcp-servers/mcp-runtime.service.ts method startServer to fetch all tools for MCPServer and register them as MCP SDK tools with proper parameter schemas

### Frontend: Schema View (US2)

- [ ] T071 [P] [US2] Create frontend/src/components/schema/SchemaListView.tsx with shadcn/ui Accordion displaying tables as accordion items, each table showing columns with data types, foreign keys indicated with arrow icon and target table, search input to filter tables/columns, highlighting prop to highlight tables/columns referenced in SQL query
- [ ] T072 [P] [US2] Create frontend/src/components/dialogs/SchemaViewDialog.tsx with shadcn/ui Dialog containing SchemaListView component, fetching schema via GET /api/schema/:datasourceId, "Refresh" button calling POST /api/schema/:datasourceId/refresh

### Frontend: Tool Creation (US2)

- [ ] T073 [P] [US2] Create frontend/src/components/dialogs/ToolDialog.tsx with shadcn/ui Dialog containing: natural language prompt textarea, "Generate SQL" button calling POST /api/tools with prompt (which internally calls query generation), generated SQL display area (read-only with syntax highlighting), tool name and description input fields, "Test" button calling POST /api/tools/:id/test with parameter values, sample results display, "Save" button to save tool, "Create Another Tool" button to reset form for bulk creation
- [ ] T074 [P] [US2] Create frontend/src/components/canvas/ToolNode.tsx custom React Flow node component displaying tool icon and name, onClick handler to open tool details dialog (placeholder for US3)

### Frontend: API Integration (US2)

- [ ] T075 [US2] Create TanStack Query mutation hooks in frontend/src/services/api.ts: useCreateTool (POST /api/tools), useTestTool (POST /api/tools/:id/test), useRefreshSchema (POST /api/schema/:datasourceId/refresh)
- [ ] T076 [US2] Create TanStack Query query hooks in frontend/src/services/api.ts: useSchema (GET /api/schema/:datasourceId), useTools (GET /api/tools with mcpServerId filter)

### Frontend: MCP Server Menu Dialog (US2)

- [ ] T077 [US2] Update frontend/src/components/canvas/MCPServerNode.tsx onClick handler to open MCPServerMenuDialog
- [ ] T078 [US2] Create frontend/src/components/dialogs/MCPServerMenuDialog.tsx with shadcn/ui Dialog showing two buttons: "Create Tool" (opens ToolDialog) and "View Schema" (opens SchemaViewDialog)

### Integration & Tool Workflow (US2)

- [ ] T079 [US2] Implement tool creation workflow: MCPServerNode click → MCPServerMenuDialog opens → "Create Tool" click → ToolDialog opens → user enters natural language prompt → "Generate SQL" generates query via LLM → user reviews SQL → user enters tool name/description → "Test" executes query and shows results → "Save" creates Tool entity → create ToolNode canvas node (nodeId: 'tool-{uuid}', type: 'tool') connected to MCP server → optionally "Create Another Tool" for bulk creation
- [ ] T080 [US2] Implement schema view workflow: MCPServerNode click → MCPServerMenuDialog opens → "View Schema" click → SchemaViewDialog opens → display all tables/columns/foreign keys in Accordion → search/filter functionality → keep dialog open while creating tools for reference
- [ ] T081 [US2] Implement SQL highlighting in schema view: when ToolDialog shows generated SQL, parse table/column references and pass to SchemaListView as highlighted items

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can create tools via natural language, view schema, and test tools

---

## Phase 5: User Story 3 - Manage and Edit Existing Tools (Priority: P3)

**Goal**: Enable users to view all tools they've created, edit their prompts or SQL queries, test them with different parameters, and remove tools they no longer need. This provides full lifecycle management of custom tools via canvas nodes.

**Independent Test**: Create several tools via US2, click a tool node to view details, edit one tool's prompt to regenerate SQL, test the updated tool with parameters, delete an unused tool, and verify all changes persist in MCP server configuration.

### Frontend: Tool Details Dialog (US3)

- [ ] T082 [P] [US3] Update frontend/src/components/dialogs/ToolDialog.tsx to support both "create" and "edit" modes, in edit mode pre-populate fields with existing tool data, "Edit Prompt" button to regenerate SQL from modified prompt, "Delete" button calling DELETE /api/tools/:id with confirmation prompt
- [ ] T083 [P] [US3] Update frontend/src/components/canvas/ToolNode.tsx onClick handler to open ToolDialog in "edit" mode with tool details pre-loaded via GET /api/tools/:id

### Frontend: API Integration (US3)

- [ ] T084 [US3] Create TanStack Query mutation hooks in frontend/src/services/api.ts: useUpdateTool (PATCH /api/tools/:id), useDeleteTool (DELETE /api/tools/:id), useDeleteCanvasNode (DELETE /api/canvas/nodes/:nodeId)

### Integration & Management Workflow (US3)

- [ ] T085 [US3] Implement tool viewing workflow: ToolNode click → ToolDialog opens in edit mode → display tool name, description, prompt, SQL query, last modified date → user can review details
- [ ] T086 [US3] Implement tool editing workflow: ToolDialog edit mode → user modifies prompt → "Edit Prompt" button calls useUpdateTool with new prompt → backend regenerates SQL via QueryGenerationService → dialog updates with new SQL → user reviews and saves → MCP server status set to 'draft'
- [ ] T087 [US3] Implement tool testing with parameters workflow: ToolDialog shows "Test" button → if tool has parameters, display input fields for each parameter → user enters values → "Test" button calls POST /api/tools/:id/test with parameter values → display query results (first 10 rows) with execution time
- [ ] T088 [US3] Implement tool deletion workflow: ToolDialog edit mode → "Delete" button shows confirmation → user confirms → call DELETE /api/tools/:id → delete ToolNode canvas node via DELETE /api/canvas/nodes/:nodeId → close dialog → remove node from canvas
- [ ] T089 [US3] Implement deletion restrictions: update backend/src/datasources/datasources.service.ts delete method to prevent deletion if MCPServer exists (check relationship, return 409 error with message "Cannot delete datasource. Please delete the MCP server first."), update backend/src/mcp-servers/mcp-servers.service.ts delete method to prevent deletion if Tools exist (check relationship, return 409 error with message "Cannot delete MCP server. Please delete all tools first.")

**Checkpoint**: All user stories should now be independently functional - full CRUD lifecycle for datasources, MCP servers, and tools via canvas

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and finalize the POC

- [ ] T090 [P] Implement AES-256 password encryption/decryption utility in backend/src/datasources/datasources.service.ts using CREDENTIALS_ENCRYPTION_KEY from environment (encrypt before save, decrypt for connection)
- [ ] T091 [P] Add error handling for LLM API failures in backend/src/query-generation/query-generation.service.ts (network timeout, rate limit, invalid API key) with specific error messages
- [ ] T092 [P] Add loading states to frontend dialogs during async operations (connection test, SQL generation, tool test) with shadcn/ui Spinner component
- [ ] T093 [P] Add error display components in frontend dialogs with specific error messages and retry buttons for LLM failures
- [ ] T094 [P] Implement canvas node position persistence on drag in frontend/src/components/canvas/FlowCanvas.tsx onNodesChange handler calling PATCH /api/canvas/nodes/batch for efficient bulk updates
- [ ] T095 [P] Add MCP server URL display to MCPServerNode showing /mcp/:slug endpoint for client configuration
- [ ] T096 [P] Implement "Create Another Tool" button functionality in ToolDialog to reset form after tool creation for streamlined bulk tool creation
- [ ] T097 [P] Add validation error displays in all frontend forms with specific field-level error messages from backend DTO validation
- [ ] T098 [P] Implement multiple datasources support: ensure "Add Datasource" AddNode persists on canvas after first datasource created, handle multiple datasource→MCP server→tools hierarchies on single canvas
- [ ] T099 [P] Add canvas interaction improvements: zoom controls, fit view button, minimap for large canvas, node drag constraints
- [ ] T100 [P] Update backend/src/app.module.ts to add global exception filter for consistent error response format across all endpoints
- [ ] T101 Validate quickstart.md workflow: follow steps in specs/001-mcp-datasource-generator/quickstart.md to connect database, create MCP server, create tools, test tools, verify MCP server accessibility, document any deviations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion, leverages US1 datasources and MCP servers but is independently testable
- **User Story 3 (Phase 5)**: Depends on Foundational phase completion, leverages US1 and US2 but is independently testable
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses datasources and MCP servers from US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses tools from US2 but independently testable

### Within Each User Story

- Shared types and DTOs before entities (parallel within story)
- Entities before services
- Services before controllers
- Backend modules before frontend components
- Frontend components before integration workflows
- Integration workflows complete the story

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Within each story: all tasks marked [P] can run in parallel
- Shared types creation (T023-T029) can all run in parallel
- Backend entities (T030, T034, T040) can run in parallel within US1
- Frontend components marked [P] can be developed in parallel

---

## Parallel Example: User Story 1

```bash
# After Foundational completes, launch all shared types together:
Task: "Create shared/src/types/datasource.types.ts"
Task: "Create shared/src/types/mcp-server.types.ts"
Task: "Create shared/src/types/canvas-node.types.ts"

# Launch all DTOs together (after types):
Task: "Create shared/src/dtos/create-datasource.dto.ts"
Task: "Create shared/src/dtos/create-mcp-server.dto.ts"
Task: "Create shared/src/dtos/create-canvas-node.dto.ts"
Task: "Create shared/src/dtos/update-canvas-node.dto.ts"

# Launch all entities together (after DTOs):
Task: "Create backend/src/datasources/entities/datasource.entity.ts"
Task: "Create backend/src/mcp-servers/entities/mcp-server.entity.ts"
Task: "Create backend/src/canvas/entities/canvas-node.entity.ts"

# Launch all React Flow node components together (after backend endpoints):
Task: "Create frontend/src/components/canvas/AddNode.tsx"
Task: "Create frontend/src/components/canvas/DatasourceNode.tsx"
Task: "Create frontend/src/components/canvas/MCPServerNode.tsx"

# Launch all dialogs together:
Task: "Create frontend/src/components/dialogs/DatasourceDialog.tsx"
Task: "Create frontend/src/components/dialogs/MCPServerDialog.tsx"
```

---

## Parallel Example: User Story 2

```bash
# Launch all shared types together:
Task: "Create shared/src/types/tool.types.ts"
Task: "Create shared/src/types/schema.types.ts"

# Launch all backend modules together (independent modules):
Task: "Create backend/src/query-generation/query-generation.service.ts"
Task: "Create backend/src/schema/schema.service.ts"
Task: "Create backend/src/tools/entities/tool.entity.ts"

# Launch all frontend components together:
Task: "Create frontend/src/components/schema/SchemaListView.tsx"
Task: "Create frontend/src/components/dialogs/SchemaViewDialog.tsx"
Task: "Create frontend/src/components/dialogs/ToolDialog.tsx"
Task: "Create frontend/src/components/canvas/ToolNode.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently - connect database via canvas, generate MCP server, verify server at /mcp/:slug
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! - Canvas-based MCP server generation)
3. Add User Story 2 → Test independently → Deploy/Demo (Core value! - Natural language tool creation)
4. Add User Story 3 → Test independently → Deploy/Demo (Full lifecycle! - Tool management)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Datasources, MCP servers, Canvas)
   - Developer B: User Story 2 (Tools, Query generation, Schema view)
   - Developer C: User Story 3 (Tool management, Edit/Delete)
3. Stories complete and integrate independently

---

## Task Count Summary

- **Phase 1 (Setup)**: 13 tasks
- **Phase 2 (Foundational)**: 9 tasks
- **Phase 3 (User Story 1)**: 35 tasks
- **Phase 4 (User Story 2)**: 24 tasks
- **Phase 5 (User Story 3)**: 8 tasks
- **Phase 6 (Polish)**: 12 tasks

**Total**: 101 tasks

**Parallel opportunities**: 59 tasks marked [P] (58% parallelizable)

**MVP Scope** (Recommended first milestone): Complete Phases 1, 2, and 3 (57 tasks) for functional canvas-based MCP server generator with React Flow interface.

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests NOT included per specification (POC focus on core functionality)
- **Canvas workflow is central to all user stories** - visual node-based interaction via React Flow is the primary UX
- MCP servers are served dynamically within backend application (not separate processes)
- OpenAI only for LLM integration, MySQL only for database support
- Minimal security and error handling (POC scope)
- No authentication or multi-tenancy (POC constraint)
- Database schema displayed in **simple table/list view** (NOT on React Flow canvas)
- React Flow canvas displays **datasource→MCP server→tools workflow** (NOT database schema tables/columns)
