/**
 * DEPRECATED: This module is legacy. Use @/core/policyEngine instead.
 *
 * Kept for backward compatibility. All new code should use:
 * - import { PolicyEngine } from '@/core/policyEngine'
 */

import { Policy } from "@/policy/policy";
import { PolicyContext, PolicyResult } from "@/types";

/**
 * Legacy PolicyEngine - use @/core/policyEngine instead
 * @deprecated Use PolicyEngine from @/core/policyEngine
 */
export class PolicyEngine {
  constructor(private readonly policies: Policy[]) {}

  evaluate(context: PolicyContext): PolicyResult {
    for (const policy of this.policies) {
      const result = policy.evaluate(context);
      if (!result.allowed) return result;
    }
    return { allowed: true } as PolicyResult;
  }
}
