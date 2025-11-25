# Tasks: MCP Server Resources

**Input**: Design documents from `/specs/002-mcp-resources/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `backend/src/`, `frontend/src/`, `shared/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for resources feature

- [x] T001 Create storage directory at `backend/public/storage/` with .gitkeep file
- [x] T002 [P] Add RESOURCE enum value to `shared/src/enums/canvas-node-type.enum.ts`
- [x] T003 [P] Add Resource interface to `shared/src/types/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create Resource entity in `backend/src/resources/entities/resource.entity.ts`
- [x] T005 Add resourceId column and relation to `backend/src/canvas/entities/canvas-node.entity.ts`
- [x] T006 Create CreateResourceDto in `backend/src/dtos/create-resource.dto.ts`
- [x] T007 Export CreateResourceDto from `backend/src/dtos/index.ts`
- [x] T008 Create ResourcesService in `backend/src/resources/resources.service.ts`
- [x] T009 Create ResourcesController in `backend/src/resources/resources.controller.ts`
- [x] T010 Create ResourcesModule in `backend/src/resources/resources.module.ts`
- [x] T011 Register ResourcesModule in `backend/src/app.module.ts`
- [x] T012 Run backend to verify TypeORM synchronizes the resources table

**Checkpoint**: Backend resource infrastructure ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Add Resource to MCP Server (Priority: P1) MVP

**Goal**: Users can upload a file and create a resource attached to an MCP server through a dialog interface

**Independent Test**: Create an MCP server, add a resource through the dialog, verify the file is stored and the resource appears in the API response

### Implementation for User Story 1

#### Backend (API endpoints)

- [x] T013 [US1] Implement `create()` method in `backend/src/resources/resources.service.ts` with file storage and canvas node creation
- [x] T014 [US1] Implement `findAll()` method in `backend/src/resources/resources.service.ts` with optional mcpServerId filter
- [x] T015 [US1] Implement `findOne()` method in `backend/src/resources/resources.service.ts`
- [x] T016 [US1] Add POST `/resources` endpoint with Multer file upload in `backend/src/resources/resources.controller.ts`
- [x] T017 [US1] Add GET `/resources` endpoint with optional mcpServerId query param in `backend/src/resources/resources.controller.ts`
- [x] T018 [US1] Add GET `/resources/:id` endpoint in `backend/src/resources/resources.controller.ts`

#### Frontend (Dialog and Form)

- [x] T019 [P] [US1] Create AddResourceDialog component in `frontend/src/components/dialogs/AddResourceDialog.tsx`
- [x] T020 [US1] Add "Add Resource" menu item to MCPServerNode dropdown in `frontend/src/components/canvas/MCPServerNode.tsx`
- [x] T021 [US1] Implement file upload form submission in AddResourceDialog
- [x] T022 [US1] Add success/error handling and dialog close on successful creation

**Checkpoint**: Users can add resources through the UI and see them in API responses

---

## Phase 4: User Story 2 - View Resource on Canvas (Priority: P2)

**Goal**: Resources appear as distinct visual nodes on the canvas connected to their parent MCP server

**Independent Test**: Load canvas with existing resources, verify resource nodes appear with correct styling and edges to MCP servers

### Implementation for User Story 2

#### Frontend (Canvas Visualization)

- [x] T023 [P] [US2] Create ResourceNode component in `frontend/src/components/canvas/ResourceNode.tsx` with distinct styling (different icon/color from ToolNode)
- [x] T024 [US2] Register ResourceNode in nodeTypes map in `frontend/src/components/canvas/FlowCanvas.tsx`
- [x] T025 [US2] Update canvas data fetching to include resources in `frontend/src/components/canvas/FlowCanvas.tsx`
- [x] T026 [US2] Add logic to create resource nodes from API data in FlowCanvas
- [x] T027 [US2] Add logic to create edges from MCP server to resource nodes in FlowCanvas
- [x] T028 [US2] Integrate new resource node creation after successful AddResourceDialog submission

**Checkpoint**: Resources display on canvas with visible connections to MCP servers

---

## Phase 5: User Story 3 - Delete Resource (Priority: P3)

**Goal**: Users can delete resources, removing the database record, canvas node, and uploaded file

**Independent Test**: Create a resource, delete it via context menu, verify node disappears and file is removed from storage

### Implementation for User Story 3

#### Backend (Delete with file cleanup)

- [x] T029 [US3] Implement `delete()` method in `backend/src/resources/resources.service.ts` with file deletion and canvas node cleanup
- [x] T030 [US3] Add DELETE `/resources/:id` endpoint in `backend/src/resources/resources.controller.ts`
- [x] T031 [US3] Implement cascade delete for resources in `backend/src/mcp-servers/mcp-servers.service.ts` delete method

#### Frontend (Delete functionality)

- [x] T032 [US3] Add delete menu item to ResourceNode component in `frontend/src/components/canvas/ResourceNode.tsx`
- [x] T033 [US3] Implement delete confirmation dialog in ResourceNode
- [x] T034 [US3] Add handleResourceDelete function in `frontend/src/components/canvas/FlowCanvas.tsx`
- [x] T035 [US3] Remove resource node and edges from canvas state after successful deletion

**Checkpoint**: Resources can be deleted with complete cleanup

---

## Phase 6: MCP Protocol Integration (Priority: P1 continuation)

**Goal**: Resources are accessible through the MCP protocol for AI assistants

**Independent Test**: Connect MCP Inspector to active server, call resources/list and resources/read, verify content is returned

### Implementation for MCP Protocol

- [x] T036 Add resources capability to MCP server initialization in `backend/src/mcp-servers/mcp-runtime.service.ts`
- [x] T037 Inject ResourcesService into MCPRuntimeService
- [x] T038 Implement resources/list handler in `backend/src/mcp-servers/mcp-runtime.service.ts`
- [x] T039 Implement resources/read handler with text/blob content encoding in `backend/src/mcp-servers/mcp-runtime.service.ts`
- [x] T040 Add handleResourcesList method for direct JSON-RPC handling in MCPRuntimeService
- [x] T041 Add handleResourcesRead method for direct JSON-RPC handling in MCPRuntimeService

**Checkpoint**: AI assistants can access resource content via MCP protocol

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and edge cases

- [x] T042 [P] Add file size validation (10MB limit) error handling in AddResourceDialog
- [x] T043 [P] Add download endpoint GET `/resources/:id/download` in `backend/src/resources/resources.controller.ts`
- [x] T044 Add error handling for storage folder not existing/not writable
- [x] T045 Verify cascade delete works when MCP server is deleted (manual test)
- [x] T046 Run quickstart.md validation - test full flow end to end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
- **MCP Protocol (Phase 6)**: Depends on Phase 3 (US1) completion - needs resources to exist
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 backend being complete (needs resources to display)
- **User Story 3 (P3)**: Depends on US2 completion (needs ResourceNode to add delete menu)
- **MCP Protocol**: Logically part of US1 but separated for clarity - needs US1 complete

### Within Each User Story

- Backend before frontend (API must exist before UI calls it)
- Service methods before controller endpoints
- Core implementation before integration

### Parallel Opportunities

- T002, T003 can run in parallel (different files in shared/)
- T019 can run in parallel with T016-T018 (frontend dialog vs backend endpoints)
- T023 can run in parallel with backend work (new component file)
- T042, T043 can run in parallel (independent improvements)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# After T004 (Resource entity), these can run in parallel:
Task: T005 "Add resourceId to canvas-node.entity.ts"
Task: T006 "Create CreateResourceDto"

# After entity and DTO:
Task: T008 "Create ResourcesService"
Task: T009 "Create ResourcesController"
```

---

## Parallel Example: User Story 1

```bash
# Backend and frontend can start in parallel once API shape is known:
# Backend track:
Task: T013-T018 "Backend API implementation"

# Frontend track (can start dialog shell while backend completes):
Task: T019 "Create AddResourceDialog component"
```

---

## Implementation Strategy

### MVP First (User Story 1 + MCP Protocol)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Add Resource)
4. Complete Phase 6: MCP Protocol Integration
5. **STOP and VALIDATE**: Test adding resources and accessing via MCP Inspector
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 + MCP Protocol → Test independently → MVP ready
3. Add User Story 2 (Canvas visualization) → Test independently
4. Add User Story 3 (Delete) → Test independently → Feature complete
5. Polish phase → Production ready

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | 3 | Storage folder, shared types |
| Phase 2: Foundational | 9 | Entity, DTO, Service, Controller, Module |
| Phase 3: US1 - Add Resource | 10 | Create resource API + dialog |
| Phase 4: US2 - View on Canvas | 6 | ResourceNode + canvas integration |
| Phase 5: US3 - Delete Resource | 7 | Delete API + UI |
| Phase 6: MCP Protocol | 6 | resources/list, resources/read handlers |
| Phase 7: Polish | 5 | Edge cases, validation, testing |
| **Total** | **46** | |

### Tasks by User Story

- **US1 (Add Resource)**: 10 tasks + 6 MCP tasks = 16 tasks
- **US2 (View on Canvas)**: 6 tasks
- **US3 (Delete Resource)**: 7 tasks
- **Shared/Infrastructure**: 12 tasks (Setup + Foundational)
- **Polish**: 5 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [US1/US2/US3] label maps task to specific user story
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Storage files go to `backend/public/storage/` - ensure this path is gitignored except .gitkeep
