/**
 * Chat completion handler - forwards messages to OpenAI with MCP tool integration.
 */

import OpenAI from 'openai';
import { mcpClient } from './mcp-client.js';
import type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolDefinition,
  ToolCall,
} from './types.js';

// Initialize OpenAI client (lazily to allow dotenv to load first)
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

/**
 * Generate a unique completion ID.
 */
function generateCompletionId(): string {
  return `chatcmpl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Build system prompt with available tools and resources information.
 */
function buildSystemPrompt(): string {
  const basePrompt = 'You are a helpful AI assistant with access to MCP tools and resources.';

  if (!mcpClient.hasConnections()) {
    return basePrompt;
  }

  const toolsDesc = mcpClient.getToolsDescription();
  const resourcesDesc = mcpClient.getResourcesDescription();

  return `${basePrompt}

## Available Tools
${toolsDesc}

## Available Resources
${resourcesDesc}

When users ask about available tools or resources, describe them based on the lists above.
Use the tools when appropriate to help answer user questions.`;
}

/**
 * Convert internal messages to OpenAI format.
 */
function toOpenAIMessages(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map(msg => {
    if (msg.role === 'tool') {
      return {
        role: 'tool' as const,
        tool_call_id: msg.tool_call_id || '',
        content: msg.content,
      };
    }

    if (msg.role === 'assistant' && msg.tool_calls) {
      return {
        role: 'assistant' as const,
        content: msg.content || null,
        tool_calls: msg.tool_calls.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
      };
    }

    return {
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    };
  });
}

/**
 * Execute all tool calls and return messages with results.
 */
async function executeToolCalls(toolCalls: ToolCall[]): Promise<ChatMessage[]> {
  const results: ChatMessage[] = [];

  for (const toolCall of toolCalls) {
    console.log(`[Chat] Executing tool: ${toolCall.function.name}`);

    try {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await mcpClient.callTool(toolCall.function.name, args);

      results.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result.content,
      });

      console.log(`[Chat] Tool ${toolCall.function.name} completed: ${result.success ? 'success' : 'error'}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Chat] Tool ${toolCall.function.name} error:`, errorMsg);

      results.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: `Error executing tool: ${errorMsg}`,
      });
    }
  }

  return results;
}

/**
 * Main chat completion handler.
 * Implements the tool execution loop: send to OpenAI → execute tools → continue until done.
 */
export async function handleChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  console.log(`[Chat] Processing ${request.messages.length} message(s)`);

  // Build messages array with system prompt
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...request.messages,
  ];

  // Get available tools
  const tools: ToolDefinition[] = mcpClient.getAllTools();
  const hasTools = tools.length > 0;

  // Maximum iterations to prevent infinite loops
  const MAX_ITERATIONS = 10;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`[Chat] Iteration ${iterations}`);

    try {
      // Call OpenAI
      const openaiMessages = toOpenAIMessages(messages);
      // Always use DEFAULT_MODEL - ignore requested model since we're proxying to OpenAI
      const completion = await getOpenAI().chat.completions.create({
        model: DEFAULT_MODEL,
        messages: openaiMessages,
        tools: hasTools ? tools as OpenAI.Chat.ChatCompletionTool[] : undefined,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens,
      });

      const choice = completion.choices[0];
      const assistantMessage = choice.message;

      // Check if we have tool calls
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`[Chat] Model requested ${assistantMessage.tool_calls.length} tool call(s)`);

        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_calls: assistantMessage.tool_calls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        });

        // Execute tools and add results
        const toolResults = await executeToolCalls(
          assistantMessage.tool_calls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          }))
        );

        messages.push(...toolResults);

        // Continue loop to get final response
        continue;
      }

      // No tool calls - we have the final response
      console.log(`[Chat] Completion finished with: ${choice.finish_reason}`);

      return {
        id: generateCompletionId(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: completion.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: assistantMessage.content || '',
            },
            finish_reason: choice.finish_reason as 'stop' | 'tool_calls' | 'length',
          },
        ],
        usage: {
          prompt_tokens: completion.usage?.prompt_tokens || 0,
          completion_tokens: completion.usage?.completion_tokens || 0,
          total_tokens: completion.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('[Chat] OpenAI API error:', error);
      throw error;
    }
  }

  // Max iterations reached - return what we have
  console.warn(`[Chat] Max iterations (${MAX_ITERATIONS}) reached`);
  return {
    id: generateCompletionId(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: DEFAULT_MODEL,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'I apologize, but I was unable to complete the request after multiple attempts. Please try again or simplify your request.',
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}
