/**
 * DEPRECATED: This module is legacy. Use @/core/orchestrator instead.
 *
 * Kept for backward compatibility. All new code should use:
 * - import { orchestrateRequest } from '@/core/orchestrator'
 */

import { MCPRequest } from "@/types";
import { orchestrateRequest } from "@/core/orchestrator";
import { createDefaultPolicyEngine } from "@/core/policyEngine";
import { ContentPolicy } from "@/policy/rules/content";
import { UsagePolicy } from "@/policy/rules/usage";

// Create default policy engine
const policyEngine = createDefaultPolicyEngine(
  new ContentPolicy(),
  new UsagePolicy()
);

/**
 * Legacy handler - use orchestrateRequest instead
 * @deprecated Use orchestrateRequest from @/core/orchestrator
 */
export async function handleMCP(request: MCPRequest) {
  const result = await orchestrateRequest(request, policyEngine);

  if (!result.allowed) {
    throw new Error(result.reason || "Access denied");
  }

  return result;
}