import { MCPRequest } from "@/types";
import { handleMCP } from "@/mcp/orchestrator";


export async function mcpGateway(request: MCPRequest) {
return handleMCP(request);
}