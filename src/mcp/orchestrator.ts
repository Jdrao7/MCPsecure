import { MCPRequest } from "@/types";
import { PolicyEngine } from "@/policy/engine";
import { ContentPolicy } from "@/policy/rules/content";
import { UsagePolicy } from "@/policy/rules/usage";
import { canExecute } from "@/access/rbac";
import { executeWithMcpSDK } from "@/executor/mcpSdkExecutor";
import { logDecision } from "@/audit/logger";


const policyEngine = new PolicyEngine([
new ContentPolicy(),
new UsagePolicy(),
]);


export async function handleMCP(request: MCPRequest) {
if (!canExecute(request.identity, "use:basic:model")) {
logDecision({
subjectId: request.identity.subjectId,
decision: "DENY",
reason: "RBAC denied",
});
throw new Error("Access denied");
}


const policyResult = policyEngine.evaluate({
prompt: request.prompt,
model: request.model,
tool: request.tool,
identityRole: request.identity.role,
});


if (!policyResult.allowed) {
logDecision({
subjectId: request.identity.subjectId,
decision: "DENY",
reason: policyResult.reason,
policy: policyResult.policy,
});
throw new Error(policyResult.reason);
}


logDecision({
subjectId: request.identity.subjectId,
decision: "ALLOW",
});


return executeWithMcpSDK(request);
}