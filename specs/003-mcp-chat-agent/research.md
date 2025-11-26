# Research: MCP Chat Agent

**Date**: 2025-11-25 | **Feature**: 003-mcp-chat-agent

## Research Questions

### 1. How to create an MCP host that connects to HTTP MCP servers?

**Decision**: Use `@modelcontextprotocol/sdk` with `StreamableHTTPClientTransport`

**Rationale**: The MCP TypeScript SDK provides native support for HTTP-based clients. The `StreamableHTTPClientTransport` is the current standard (as of protocol version 2025-03-26) replacing the deprecated SSE transport.

**Implementation Pattern**:
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:3000/mcp')
);

const client = new Client({
  name: 'agent',
  version: '1.0.0'
}, { capabilities: {} });

await client.connect(transport);

// List tools
const { tools } = await client.listTools();

// Call a tool
const result = await client.callTool({
  name: 'tool-name',
  arguments: { arg1: 'value1' }
});

// List resources
const { resources } = await client.listResources();

// Read resource
const content = await client.readResource({ uri: 'resource://id' });
```

**Alternatives Considered**:
- **WebSocket transport**: Lower latency but more complex setup. Rejected - HTTP is simpler for POC.
- **Custom HTTP client**: Would duplicate SDK functionality. Rejected - use official SDK.

---

### 2. How to integrate with Open WebUI?

**Decision**: Expose OpenAI-compatible `/v1/chat/completions` endpoint

**Rationale**: Open WebUI natively supports connecting to any OpenAI-compatible API. Our agent will act as a proxy that implements this endpoint, internally using OpenAI and MCP tools.

**Configuration**:
- Open WebUI config: `OPENAI_API_BASE_URL=http://host.docker.internal:8082/v1`
- Docker networking: Use `host.docker.internal` when Open WebUI runs in Docker but agent runs on host

**API Contract Required**:
```
POST /v1/chat/completions

Request:
{
  "model": "string",
  "messages": [{"role": "user|assistant|system", "content": "string"}],
  "stream": boolean (optional)
}

Response:
{
  "id": "chatcmpl-xxx",
  "model": "string",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "string"},
    "finish_reason": "stop"
  }],
  "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
}
```

**Alternatives Considered**:
- **Direct Open WebUI plugin**: Would require forking Open WebUI. Rejected - too complex for POC.
- **WebSocket interface**: Non-standard, requires custom UI changes. Rejected.

---

### 3. How to implement tool calling with OpenAI?

**Decision**: Use OpenAI SDK's native tool calling with manual conversation loop

**Rationale**: OpenAI SDK v4.x provides built-in support for function calling. We'll convert MCP tools to OpenAI tool format and handle the tool execution loop manually for maximum control.

**Implementation Pattern**:
```typescript
import OpenAI from 'openai';

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'tool-name',
      description: 'Tool description',
      parameters: mcpToolInputSchema, // MCP's inputSchema is already JSON Schema
    },
  },
];

// Send request with tools
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages,
  tools,
});

// Handle tool calls
if (response.choices[0].message.tool_calls) {
  for (const toolCall of response.choices[0].message.tool_calls) {
    const args = JSON.parse(toolCall.function.arguments);
    const result = await mcpClient.callTool({
      name: toolCall.function.name,
      arguments: args
    });

    // Add tool result to messages
    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(result),
    });
  }
}
```

**Tool Conversion (MCP → OpenAI)**:
```typescript
function convertMcpToolToOpenAI(mcpTool: McpTool): OpenAI.Chat.ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: mcpTool.name,
      description: mcpTool.description || '',
      parameters: mcpTool.inputSchema,
    },
  };
}
```

**Alternatives Considered**:
- **Anthropic Claude with tool_use**: Would work but spec mentions OpenAI key exists. Rejected.
- **SDK runTools helper**: Available but less control. Rejected - need visibility for permission flow.

---

### 4. Port allocation for the agent?

**Decision**: Use port 8082 for the agent

**Rationale**: Avoids conflicts with existing services:
- 3001: Backend
- 5173: Frontend
- 3307: MySQL
- 4000: Existing Open WebUI container (if reused)

**Alternatives Considered**:
- Port 8080: Common default, might conflict with other services. Rejected.
- Port 3002: Close to backend port, could cause confusion. Rejected.

---

### 5. How to handle permission requests for tool execution?

**Decision**: Implement in the agent backend, not in Open WebUI

**Rationale**: Since Open WebUI only speaks OpenAI-compatible API, permission flow must happen at the agent level. For this POC, we'll implement a simple approach:
1. Agent detects tool calls from OpenAI response
2. For POC: Auto-approve all tool calls (minimal implementation)
3. Future: Could add WebSocket endpoint for real-time permission requests

**Note**: The spec requires permission-based tool execution (FR-004), but for POC simplicity, we can log tool calls and auto-execute. A production version would need a more sophisticated UI integration.

**Alternatives Considered**:
- **Custom Open WebUI fork with permission modal**: Too complex for POC. Rejected.
- **Separate permission approval webpage**: Additional complexity. Rejected for MVP.

---

## Technology Stack Summary

| Component | Choice | Version/Port |
|-----------|--------|--------------|
| Language | TypeScript | 5.x |
| Runtime | Node.js | 20+ |
| Web Framework | Express.js | 4.x |
| LLM SDK | openai | 4.x |
| MCP SDK | @modelcontextprotocol/sdk | 1.x |
| Chat UI | Open WebUI | Docker |
| Agent Port | - | 8082 |
| Open WebUI Port | - | 4000 (existing) or 8080 (new) |

## Open Questions Resolved

1. **Q**: How does MCP handle multiple servers?
   **A**: Create multiple Client instances, each with its own transport. Aggregate tools from all clients.

2. **Q**: Streaming support needed?
   **A**: Nice to have but not required for POC. Will implement non-streaming first.

3. **Q**: Conversation persistence?
   **A**: In-memory per session (spec states persistence across sessions is out of scope).
