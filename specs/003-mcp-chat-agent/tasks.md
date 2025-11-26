# Tasks: MCP Chat Agent

**Input**: Design documents from `/specs/003-mcp-chat-agent/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not included (POC scope - manual testing per plan.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Agent project**: `agent/` at repository root (independent from backend/frontend workspaces)
- **Source code**: `agent/src/`
- **Config files**: `agent/` root

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create agent folder structure and initialize TypeScript/Express project

- [x] T001 Create agent folder structure: `agent/`, `agent/src/`
- [x] T002 Create agent/package.json with dependencies: express, openai, @modelcontextprotocol/sdk, typescript, ts-node, dotenv
- [x] T003 [P] Create agent/tsconfig.json with ES modules and strict mode
- [x] T004 [P] Create agent/mcp-servers.json config file for MCP server URLs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create TypeScript interfaces for entities in agent/src/types.ts (ChatMessage, ToolCall, ToolDefinition, McpServerConfig, ChatSession, ToolExecutionResult)
- [x] T006 Implement MCP client manager in agent/src/mcp-client.ts (connect to configured servers, aggregate tools/resources)
- [x] T007 Create Express server entry point in agent/src/index.ts with health check endpoint
- [x] T008 [P] Create agent/docker-compose.yml for Open WebUI container (port 8080 internal, expose on available port)
- [x] T009 Add npm scripts to agent/package.json: dev, build, start (single command to launch agent + docker)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Chat Conversation (Priority: P1) 🎯 MVP

**Goal**: Users can send messages and receive AI responses through Open WebUI

**Independent Test**: Open http://localhost:8080, send "Hello", verify coherent response within 10 seconds

### Implementation for User Story 1

- [x] T010 [US1] Create OpenAI client initialization in agent/src/chat.ts using OPENAI_API_KEY from root .env
- [x] T011 [US1] Implement POST /v1/chat/completions endpoint in agent/src/index.ts (request parsing, response formatting per OpenAPI spec)
- [x] T012 [US1] Implement chat completion handler in agent/src/chat.ts (forward messages to OpenAI, return formatted response)
- [x] T013 [US1] Implement GET /v1/models endpoint in agent/src/index.ts (required by Open WebUI)
- [x] T014 [US1] Add in-memory session management in agent/src/chat.ts (maintain conversation context per request)
- [x] T015 [US1] Add error handling and logging for chat failures in agent/src/chat.ts

**Checkpoint**: User Story 1 complete - basic chat works via Open WebUI without MCP tools

---

## Phase 4: User Story 2 - Tool Execution with Permission (Priority: P1)

**Goal**: Agent executes MCP tools when LLM requests them (auto-approved for POC)

**Independent Test**: Ask agent to use a tool (e.g., "list tables"), verify tool is called and result returned

### Implementation for User Story 2

- [x] T016 [US2] Add MCP tool conversion function in agent/src/mcp-client.ts (convert MCP tools to OpenAI function format)
- [x] T017 [US2] Integrate MCP tools into chat completion request in agent/src/chat.ts (pass converted tools to OpenAI)
- [x] T018 [US2] Implement tool call detection in agent/src/chat.ts (check response.choices[0].message.tool_calls)
- [x] T019 [US2] Implement tool execution loop in agent/src/chat.ts (call MCP tool, add result to messages, continue until no more tool calls)
- [x] T020 [US2] Add tool execution logging in agent/src/chat.ts (log tool name, arguments, result for visibility)
- [x] T021 [US2] Add error handling for tool execution failures in agent/src/chat.ts (graceful error message, continue conversation)

**Checkpoint**: User Story 2 complete - agent can use MCP tools in conversation

---

## Phase 5: User Story 3 - View Available Tools and Resources (Priority: P2)

**Goal**: Users can ask what tools/resources are available and get a list

**Independent Test**: Ask "What tools do you have?", verify agent lists available MCP tools

### Implementation for User Story 3

- [x] T022 [US3] Add system prompt to agent/src/chat.ts that includes available tool/resource list
- [x] T023 [US3] Format tool descriptions for natural language listing in agent/src/chat.ts

**Checkpoint**: User Story 3 complete - users can discover agent capabilities

---

## Phase 6: User Story 4 - MCP Resource Access (Priority: P2)

**Goal**: Agent can read MCP resources when relevant to conversation

**Independent Test**: Ask about data exposed via MCP resource, verify agent retrieves and uses it

### Implementation for User Story 4

- [x] T024 [US4] Add resource listing to MCP client in agent/src/mcp-client.ts (fetch from connected servers)
- [x] T025 [US4] Create resource access helper in agent/src/mcp-client.ts (readResource by URI)
- [x] T026 [US4] Add resource URIs to system prompt in agent/src/chat.ts (inform LLM about available resources)
- [x] T027 [US4] Implement resource retrieval in tool execution loop in agent/src/chat.ts (detect resource access, fetch content)

**Checkpoint**: User Story 4 complete - agent can use MCP resources in answers

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and documentation

- [x] T028 [P] Verify agent starts cleanly with `npm start` in agent/
- [x] T029 [P] Test Open WebUI connection to agent (configure in Admin Settings)
- [x] T030 Update quickstart.md with final instructions in specs/003-mcp-chat-agent/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 priority but US2 depends on US1 (needs chat working first)
  - US3 and US4 are both P2 priority and can proceed after US2
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 (needs chat endpoint working to add tool support)
- **User Story 3 (P2)**: Can start after US2 (needs MCP client initialized)
- **User Story 4 (P2)**: Can start after US2 (needs MCP client initialized)

### Within Each User Story

- Core implementation before integration
- Error handling after main functionality
- Story complete before moving to next priority

### Parallel Opportunities

- T003 and T004 can run in parallel (different files)
- T008 can run in parallel with T005-T007 (Docker config vs TypeScript code)
- US3 and US4 can run in parallel after US2 is complete

---

## Parallel Example: Setup Phase

```bash
# Launch parallel tasks:
Task: "Create agent/tsconfig.json with ES modules and strict mode"
Task: "Create agent/mcp-servers.json config file for MCP server URLs"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Basic Chat)
4. **VALIDATE**: Test basic chat through Open WebUI
5. Complete Phase 4: User Story 2 (Tool Execution)
6. **VALIDATE**: Test tool execution through Open WebUI
7. Deploy/demo if ready - this is a working MCP host!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Chat works → Demo basic agent
3. Add User Story 2 → Tools work → Demo MCP integration
4. Add User Stories 3 + 4 → Discovery + Resources → Full feature

### Single Developer Strategy

Given POC scope:
1. Complete phases sequentially
2. Validate at each checkpoint
3. Stop after US2 if time-constrained (delivers MVP)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- POC simplification: Tool permission auto-approved (logged but not prompted)
- Port 8082 for agent (avoids 3001/5173/3307/4000 conflicts)
