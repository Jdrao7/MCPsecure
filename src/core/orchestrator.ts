import { Identity, MCPRequest, PolicyContext, Role } from "@/types";
import { canExecuteModel, canUseTool } from "@/access/rbac";
import { PolicyEngine } from "@/core/policyEngine";
import { logDenied, logAllowed } from "@/audit/logger";

/**
 * Orchestrator - Request Flow Controller
 *
 * Implements the strict authorization flow:
 * 1. Validate input (Zod schemas at boundary)
 * 2. RBAC - First gate (role-based access control)
 * 3. Policy Engine - Second gate (content + usage policies)
 * 4. Execution - MCP tool calling with Groq (via executor)
 * 5. Audit - Log the decision and outcome
 *
 * NO STEP MAY BE SKIPPED. NO SHORTCUTS.
 *
 * Patterns:
 * - Fail-fast: Exit immediately on any denial
 * - Stateless: No in-memory state persistence
 * - Traceable: Every decision tracked for audit
 */

export interface OrchestrationResult {
  allowed: boolean;
  reason?: string;
  policy?: string;
  model: string;
  tool?: string;
  subjectId: string;
  duration_ms: number;
  evaluationChain?: Array<{ policyName: string; allowed: boolean; reason?: string }>;
}

/**
 * Orchestrate a request through the authorization pipeline
 */
export async function orchestrateRequest(
  request: MCPRequest,
  policyEngine: PolicyEngine
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const { identity, prompt, model, tool } = request;

  try {
    // STEP 1: RBAC - First Gate
    // Check if the identity's role can execute this model
    if (!canExecuteModel(identity, model)) {
      const reason = `Identity ${identity.subjectId} with role ${identity.role} cannot execute model ${model}`;
      logDenied(
        identity.subjectId,
        reason,
        "RBAC",
        model,
        tool,
        Date.now() - startTime
      );

      return {
        allowed: false,
        reason,
        policy: "RBAC",
        model,
        tool,
        subjectId: identity.subjectId,
        duration_ms: Date.now() - startTime,
      };
    }

    // STEP 2: RBAC - Check tool permission if tool is specified
    if (tool && !canUseTool(identity, tool)) {
      const reason = `Identity ${identity.subjectId} with role ${identity.role} cannot use tool ${tool}`;
      logDenied(
        identity.subjectId,
        reason,
        "RBAC",
        model,
        tool,
        Date.now() - startTime
      );

      return {
        allowed: false,
        reason,
        policy: "RBAC",
        model,
        tool,
        subjectId: identity.subjectId,
        duration_ms: Date.now() - startTime,
      };
    }

    // STEP 3: Policy Engine - Second Gate
    // Evaluate all registered policies against the request context
    const policyContext: PolicyContext = {
      prompt,
      model,
      tool,
      identityRole: identity.role,
      subjectId: identity.subjectId,
    };

    const policyResult = policyEngine.evaluateAll(policyContext);

    if (!policyResult.allowed) {
      logDenied(
        identity.subjectId,
        policyResult.reason || "Policy denial",
        policyResult.policy || "Unknown",
        model,
        tool,
        Date.now() - startTime
      );

      return {
        allowed: false,
        reason: policyResult.reason,
        policy: policyResult.policy,
        model,
        tool,
        subjectId: identity.subjectId,
        duration_ms: Date.now() - startTime,
        evaluationChain: policyResult.evaluationChain,
      };
    }

    // STEP 4: All gates passed - Log success
    logAllowed(
      identity.subjectId,
      model,
      tool,
      Date.now() - startTime
    );

    return {
      allowed: true,
      model,
      tool,
      subjectId: identity.subjectId,
      duration_ms: Date.now() - startTime,
      evaluationChain: policyResult.evaluationChain,
    };
  } catch (error) {
    const reason = `Orchestration error: ${error instanceof Error ? error.message : "Unknown error"}`;
    logDenied(
      identity.subjectId,
      reason,
      "ORCHESTRATOR",
      model,
      tool,
      Date.now() - startTime
    );

    return {
      allowed: false,
      reason,
      policy: "ORCHESTRATOR",
      model,
      tool,
      subjectId: identity.subjectId,
      duration_ms: Date.now() - startTime,
    };
  }
}

/**
 * Create an orchestrator configuration object
 * Useful for dependency injection in larger applications
 */
export interface OrchestratorConfig {
  policyEngine: PolicyEngine;
  enableAudit: boolean;
  enableLogging: boolean;
}

/**
 * Create a configured orchestrator
 */
export function createOrchestrator(
  config: OrchestratorConfig
): {
  orchestrate: (request: MCPRequest) => Promise<OrchestrationResult>;
  config: OrchestratorConfig;
} {
  return {
    orchestrate: (request: MCPRequest) =>
      orchestrateRequest(request, config.policyEngine),
    config,
  };
}
