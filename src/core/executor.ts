import { getGroqClient, callGroqWithTools, convertToGroqTool } from "@/lib/groq";
import { MCPRequest } from "@/types";

/**
 * Executor - Groq + MCP Integration Layer
 *
 * Handles the execution phase after all authorization gates have passed.
 * Responsible for:
 * - Converting MCP tools to Groq format
 * - Calling Groq LLM with tools
 * - Processing tool responses
 * - Returning results to caller
 *
 * Design:
 * - Stateless (no in-memory state)
 * - Idempotent (same input → same output)
 * - Vercel-compatible (no long-running processes)
 */

export interface ExecutionResult {
  content: string;
  model: string;
  toolsUsed?: string[];
  tokensUsed?: {
    input: number;
    output: number;
  };
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Execute a request against Groq with optional tool calling
 *
 * @param request The MCP request containing identity, prompt, model, optional tool
 * @param tools Optional array of MCP tools available for the LLM
 * @returns Execution result with response content and metadata
 */
export async function executeWithGroq(
  request: MCPRequest,
  tools?: MCPTool[]
): Promise<ExecutionResult> {
  try {
    const { prompt, model, tool: requestedTool } = request;

    // Filter tools if specific tool was requested
    let availableTools: ReturnType<typeof convertToGroqTool>[] = [];
    
    if (tools && tools.length > 0) {
      const toUse = requestedTool
        ? tools.filter((t) => t.name === requestedTool)
        : tools;
      
      availableTools = toUse.map((t) =>
        convertToGroqTool(t.name, t.description, t.inputSchema)
      );
    }

    // Call Groq with tools
    const response = await callGroqWithTools(
      prompt,
      model,
      availableTools
    );

    // Extract content from response
    const content =
      response.choices[0]?.message?.content ||
      "No response from model";

    return {
      content,
      model,
      toolsUsed: extractToolCalls(response),
      tokensUsed: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
      },
    };
  } catch (error) {
    return {
      content: "",
      model: request.model,
      error: error instanceof Error ? error.message : "Unknown execution error",
    };
  }
}

/**
 * Extract tool calls from Groq response
 */
function extractToolCalls(response: any): string[] {
  const toolCalls: string[] = [];

  const message = response.choices?.[0]?.message;
  if (message?.tool_calls) {
    for (const call of message.tool_calls) {
      if (call.function?.name) {
        toolCalls.push(call.function.name);
      }
    }
  }

  return toolCalls;
}

/**
 * Test executor - returns mock result without calling Groq
 * Useful for testing authorization flows without LLM calls
 */
export async function executeTest(
  request: MCPRequest,
  _tools?: MCPTool[]
): Promise<ExecutionResult> {
  return {
    content: `Test response for: "${request.prompt}"`,
    model: request.model,
    toolsUsed: request.tool ? [request.tool] : [],
  };
}

/**
 * Create an executor with custom configuration
 */
export interface ExecutorConfig {
  useTest?: boolean;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Create a configured executor
 */
export function createExecutor(config?: ExecutorConfig) {
  return {
    execute: (request: MCPRequest, tools?: MCPTool[]) => {
      if (config?.useTest) {
        return executeTest(request, tools);
      }
      return executeWithGroq(request, tools);
    },
    config: config || {},
  };
}
