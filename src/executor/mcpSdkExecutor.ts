import { MCPRequest, MCPResponse } from "@/types";


export async function executeWithMcpSDK(
request: MCPRequest
): Promise<MCPResponse> {
// Mock MCP SDK execution
return {
output: `Model ${request.model} executed for prompt: ${request.prompt}`
};
}