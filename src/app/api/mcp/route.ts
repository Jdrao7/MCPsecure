import { NextRequest, NextResponse } from "next/server";
import { mcpGateway } from "../../../mcp/gateway";


export async function POST(req: NextRequest) {
const body = await req.json();


try {
const result = await mcpGateway({
identity: body.identity,
prompt: body.prompt,
model: body.model,
tool: body.tool,
timestamp: Date.now(),
});


return NextResponse.json(result);
} catch (err: any) {
return NextResponse.json(
{ error: err.message },
{ status: 403 }
);
}
}