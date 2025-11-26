# Quickstart: MCP Chat Agent

**Feature**: 003-mcp-chat-agent | **Date**: 2025-11-25

## Overview

The MCP Chat Agent is a minimal TypeScript/Express application that:
1. Exposes an OpenAI-compatible API (`/v1/chat/completions`)
2. Connects to HTTP MCP servers to discover and execute tools
3. Works with Open WebUI as the chat interface

## Prerequisites

- Node.js 20+
- Docker (for Open WebUI)
- OpenAI API key (in root `.env` file)
- At least one running MCP server (HTTP transport)

## Quick Start

### 1. Install Dependencies

```bash
cd agent
npm install
```

### 2. Configure Environment

The agent reads from the root `.env` file. Ensure it contains:

```env
OPENAI_API_KEY=sk-your-key-here
```

### 3. Configure MCP Servers

Edit `agent/mcp-servers.json` to add your MCP server URLs:

```json
{
  "servers": [
    {
      "name": "My MCP Server",
      "url": "http://localhost:3001/mcp/my-server-slug",
      "enabled": true
    }
  ]
}
```

### 4. Start Everything

Single command to launch both agent and Open WebUI:

```bash
cd agent
npm start
```

This will:
- Start the agent on port 8082
- Start Open WebUI on port 8080 (Docker)

**Alternative: Start separately**

```bash
# Terminal 1: Start agent only
cd agent
npm run dev

# Terminal 2: Start Open WebUI only
cd agent
docker compose up -d
```

To stop Open WebUI: `cd agent && npm run stop` (or `docker compose down`)

### 5. Access Chat Interface

Open your browser to: **http://localhost:8080**

Configure Open WebUI to use the agent:
1. Go to Admin Settings → Connections
2. Add OpenAI Connection:
   - URL: `http://host.docker.internal:8082/v1`
   - API Key: (leave blank)

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Open WebUI │────▶│   Agent     │────▶│   OpenAI    │
│  (Docker)   │     │  (Express)  │     │     API     │
│  :8080      │     │   :8082     │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          │ MCP Protocol (HTTP)
                          │
                   ┌──────▼──────┐
                   │ MCP Servers │
                   │ (HTTP)      │
                   └─────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/chat/completions` | POST | Chat completion (OpenAI-compatible) |
| `/v1/models` | GET | List available models |

## Example Usage

### Direct API Call

```bash
curl -X POST http://localhost:8082/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Using MCP Tools

When you ask the agent to perform a task that requires an MCP tool:

1. Agent receives your message
2. OpenAI determines a tool call is needed
3. Agent executes the MCP tool
4. Results are sent back to OpenAI
5. Final response is returned to you

Example conversation:
```
You: "What tables are in the database?"
Agent: (calls MCP tool `list_tables`)
Agent: "The database contains the following tables: users, orders, products..."
```

## Troubleshooting

### Agent won't start
- Check that port 8082 is available: `lsof -i :8082`
- Verify OPENAI_API_KEY is set in `.env`

### Open WebUI can't connect to agent
- Ensure agent is running and accessible
- In Docker, use `host.docker.internal` instead of `localhost`
- Check Open WebUI logs: `docker logs open-webui`

### MCP tools not appearing
- Verify MCP servers are running
- Check `mcp-servers.json` configuration
- Look for connection errors in agent logs

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| OPENAI_API_KEY | Yes | - | OpenAI API key |
| AGENT_PORT | No | 8082 | Agent HTTP port |
| OPENAI_MODEL | No | gpt-4o | Default model for completions |

### MCP Server Config (`mcp-servers.json`)

```json
{
  "servers": [
    {
      "name": "string",     // Display name
      "url": "string",      // Full URL to MCP endpoint
      "enabled": boolean    // Whether to connect at startup
    }
  ]
}
```
