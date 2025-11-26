# Data Model: MCP Chat Agent

**Date**: 2025-11-25 | **Feature**: 003-mcp-chat-agent

## Overview

This document defines the key entities and data structures for the MCP Chat Agent. Given the POC nature, the model is intentionally minimal with in-memory storage only.

## Entities

### ChatMessage

Represents a single message in the conversation.

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;      // Only for role='tool'
  toolCalls?: ToolCall[];   // Only for role='assistant' when tools are invoked
  timestamp: number;        // Unix epoch ms
}
```

**Constraints**:
- `role` is required
- `content` is required (can be empty string for tool call messages)
- `toolCallId` is required when `role='tool'`

---

### ToolCall

Represents a tool invocation requested by the LLM.

```typescript
interface ToolCall {
  id: string;               // Unique ID from OpenAI
  name: string;             // Tool name (matches MCP tool name)
  arguments: Record<string, unknown>;
}
```

**Constraints**:
- `id` must be unique within a conversation
- `name` must match a registered MCP tool

---

### ToolDefinition

Represents an MCP tool converted for use with OpenAI.

```typescript
interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: JsonSchema;  // JSON Schema object
  };
}
```

**Source**: Converted from MCP tool via `listTools()` response.

---

### McpServerConfig

Configuration for connecting to an MCP server.

```typescript
interface McpServerConfig {
  name: string;             // Human-readable name
  url: string;              // HTTP endpoint URL
  enabled: boolean;
}
```

**Storage**: Loaded from environment or config file at startup.

---

### ChatSession (In-Memory)

Represents an active chat session with conversation history.

```typescript
interface ChatSession {
  id: string;               // UUID
  messages: ChatMessage[];
  createdAt: number;        // Unix epoch ms
}
```

**Constraints**:
- Sessions are ephemeral (in-memory only)
- No persistence across server restarts

---

### ToolExecutionResult

Result from executing an MCP tool.

```typescript
interface ToolExecutionResult {
  success: boolean;
  content: string;          // Stringified result or error message
  isError: boolean;
}
```

---

## Entity Relationships

```
ChatSession 1 ──── * ChatMessage
                      │
                      ├── role='assistant' with toolCalls[]
                      │         │
                      │         └── ToolCall ────> ToolDefinition
                      │
                      └── role='tool' (result of ToolCall)

McpServerConfig * ────> ToolDefinition (discovered at runtime)
```

## State Transitions

### ChatMessage Flow

```
[User Input]
    │
    ▼
ChatMessage(role='user')
    │
    ▼
[LLM Processing]
    │
    ├── No tools needed ──> ChatMessage(role='assistant', content=response)
    │
    └── Tools needed ──> ChatMessage(role='assistant', toolCalls=[...])
                              │
                              ▼
                         [Execute each tool via MCP]
                              │
                              ▼
                         ChatMessage(role='tool', toolCallId=X, content=result)
                              │
                              ▼
                         [Continue LLM with tool results]
                              │
                              ▼
                         ChatMessage(role='assistant', content=final_response)
```

## Notes

- **No database**: All data is in-memory for POC simplicity
- **No user authentication**: Single-user scenario
- **No message persistence**: Conversation lost on restart
- **Tool permissions**: For POC, all tools auto-approved (no PermissionRequest entity needed)
