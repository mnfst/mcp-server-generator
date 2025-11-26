# Implementation Plan: MCP Chat Agent

**Branch**: `003-mcp-chat-agent` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-mcp-chat-agent/spec.md`

## Summary

Create a minimal TypeScript/Express agent that acts as an MCP host, enabling chat interactions with OpenAI and tool/resource execution from HTTP MCP servers. The agent will be paired with Open WebUI (Docker container) as the chat interface, with a single command to launch both.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Express.js, OpenAI SDK, @modelcontextprotocol/sdk
**Storage**: N/A (stateless chat sessions, conversation maintained in-memory per session)
**Testing**: Manual testing (POC scope - minimal code philosophy)
**Target Platform**: Linux server (localhost development)
**Project Type**: Single project (agent folder at repo root)
**Performance Goals**: Response within 10 seconds as per spec SC-001
**Constraints**: Must not overlap ports with existing services (3001 backend, 5173 frontend, 3307 MySQL, 4000 Open WebUI)
**Scale/Scope**: POC demonstration - single user, minimal complexity

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modularity First | ✅ PASS | Agent is self-contained in `/agent` folder, independent from existing backend/frontend |
| II. Code Quality - Simplicity | ✅ PASS | Explicitly minimal implementation per user request |
| II. Code Quality - Understandable | ✅ PASS | Simple Express endpoints with clear naming |
| III. Documentation as Code | ✅ PASS | Spec, plan, quickstart artifacts created |
| IV. Incremental Delivery | ✅ PASS | P1 stories deliver standalone chat + tool execution |
| V. Specification-Driven | ✅ PASS | Spec completed before planning |

**Gate Result**: PASS - All principles satisfied

### Post-Phase 1 Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modularity First | ✅ PASS | Agent folder is fully independent, no shared code with existing workspaces |
| II. Code Quality - Simplicity | ✅ PASS | 3-file design (index.ts, chat.ts, mcp-client.ts) - minimal structure |
| II. Code Quality - Understandable | ✅ PASS | Clear entity types in data-model.md, OpenAPI contract documented |
| III. Documentation as Code | ✅ PASS | research.md, data-model.md, quickstart.md, contracts/ all created |
| IV. Incremental Delivery | ✅ PASS | P1 delivers basic chat + tool execution as standalone value |
| V. Specification-Driven | ✅ PASS | All design artifacts complete before implementation |

**Post-Design Gate Result**: PASS - Ready for task generation

## Project Structure

### Documentation (this feature)

```text
specs/003-mcp-chat-agent/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
agent/
├── package.json         # Agent dependencies
├── tsconfig.json        # TypeScript config
├── src/
│   ├── index.ts         # Express server entry point
│   ├── chat.ts          # Chat endpoint handler
│   └── mcp-client.ts    # MCP host client for HTTP servers
└── docker-compose.yml   # Open WebUI configuration (separate from root compose)
```

**Structure Decision**: Single project in `/agent` folder. Completely independent from existing workspace (backend/frontend/shared). Uses root `.env` for OPENAI_API_KEY. Docker compose for Open WebUI will use port 8080 (internal) mapped to an available external port (avoiding 4000 if already used).

## Complexity Tracking

> No violations - design follows minimal complexity approach as explicitly requested.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| - | - | - |
