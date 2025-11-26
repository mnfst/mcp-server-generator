/**
 * MCP Chat Agent - Express server entry point.
 * Exposes OpenAI-compatible API for Open WebUI integration.
 */

import express from 'express';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mcpClient } from './mcp-client.js';
import { handleChatCompletion } from './chat.js';
import type { ChatCompletionRequest, ModelsResponse } from './types.js';

// Load .env from repository root
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '..', '.env') });

const PORT = process.env.AGENT_PORT || 8082;
const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// GET /v1/models - Required by Open WebUI
app.get('/v1/models', (_req, res) => {
  const response: ModelsResponse = {
    object: 'list',
    data: [
      {
        id: 'mcp-agent',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'mcp-chat-agent',
      },
    ],
  };
  res.json(response);
});

// POST /v1/chat/completions - Main chat endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const request = req.body as ChatCompletionRequest;

    if (!request.messages || request.messages.length === 0) {
      res.status(400).json({
        error: {
          message: 'messages array is required',
          type: 'invalid_request_error',
          code: 'missing_messages',
        },
      });
      return;
    }

    const response = await handleChatCompletion(request);
    res.json(response);
  } catch (error) {
    console.error('[API] Chat completion error:', error);
    res.status(500).json({
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        type: 'server_error',
        code: 'internal_error',
      },
    });
  }
});

// Start server
async function start() {
  console.log('[Agent] Initializing MCP connections...');
  await mcpClient.initialize();

  const tools = mcpClient.getAllTools();
  const resources = mcpClient.getAllResources();
  console.log(`[Agent] Ready with ${tools.length} tools and ${resources.length} resources`);

  app.listen(PORT, () => {
    console.log(`[Agent] Server running on http://localhost:${PORT}`);
    console.log(`[Agent] OpenAI-compatible API: http://localhost:${PORT}/v1`);
  });
}

start().catch(console.error);
