import Groq from "groq-sdk";

/**
 * Groq client wrapper
 * Dynamically creates client with real API key at runtime
 */

let cachedGroqClient: Groq | null = null;

/**
 * Get or create Groq client with current API key
 * Ensures fresh initialization with real credentials
 */
export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY environment variable is not set. Please add it to .env.local"
    );
  }

  // Reinitialize if API key changed or client doesn't exist
  if (!cachedGroqClient) {
    cachedGroqClient = new Groq({
      apiKey,
      defaultHeaders: {
        "User-Agent": "policy-access-driven-mcp/1.0",
      },
    });
  }

  return cachedGroqClient;
}

// Backward compatibility export
export function getGroqClientInstance(): Groq {
  return getGroqClient();
}

/**
 * Tool schema converter
 * Converts MCP tool definitions to Groq tool calling format
 */
export function convertToGroqTool(
  name: string,
  description: string,
  inputSchema?: Record<string, unknown>
) {
  return {
    type: "function" as const,
    function: {
      name,
      description,
      parameters: {
        type: "object" as const,
        properties: inputSchema?.properties || {},
        required: inputSchema?.required || [],
      },
    },
  };
}

/**
 * Call Groq with tool use
 * Returns response with potential tool calls
 */
export async function callGroqWithTools(
  prompt: string,
  model: string,
  tools: ReturnType<typeof convertToGroqTool>[]
) {
  const client = getGroqClient();

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      ...(tools && tools.length > 0
        ? { tools, tool_choice: "auto" }
        : {}),
      max_tokens: 2048,
      temperature: 0.7,
    });

    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Groq API error";
    console.error("[GROQ_ERROR]", {
      message: errorMessage,
      model,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

