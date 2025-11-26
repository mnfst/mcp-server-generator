/**
 * TypeScript interfaces for MCP Chat Agent entities.
 * Based on data-model.md specification.
 */

/** JSON Schema type for tool parameters */
export type JsonSchema = Record<string, unknown>;

/** A single message in the conversation */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  timestamp?: number;
}

/** A tool invocation requested by the LLM */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON-encoded string
  };
}

/** An MCP tool converted for use with OpenAI */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: JsonSchema;
  };
}

/** Configuration for connecting to an MCP server */
export interface McpServerConfig {
  name: string;
  url: string;
  enabled: boolean;
}

/** MCP servers configuration file structure */
export interface McpServersConfig {
  servers: McpServerConfig[];
}

/** In-memory chat session */
export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
}

/** Result from executing an MCP tool */
export interface ToolExecutionResult {
  success: boolean;
  content: string;
  isError: boolean;
}

/** MCP Resource information */
export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/** OpenAI-compatible chat completion request */
export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  stream?: boolean;
  max_tokens?: number;
}

/** OpenAI-compatible chat completion response */
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'tool_calls' | 'length';
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Model list response for /v1/models endpoint */
export interface ModelsResponse {
  object: 'list';
  data: {
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
  }[];
}
