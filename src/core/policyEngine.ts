import { Policy } from "@/policy/policy";
import { PolicyContext, PolicyResult } from "@/types";

/**
 * Policy Engine
 *
 * Orchestrates evaluation of multiple policies in strict order.
 * Acts as the second authorization gate after RBAC.
 *
 * Design:
 * - Policies are evaluated in registration order
 * - First denial wins (short-circuit)
 * - No policy may be skipped
 * - All results are tracked for audit logging
 */
export class PolicyEngine {
  private policies: Policy[] = [];
  private evaluationLog: Array<{
    policyName: string;
    allowed: boolean;
    reason?: string;
  }> = [];

  /**
   * Register a policy for evaluation
   * Order matters - policies are evaluated in registration order
   */
  registerPolicy(policy: Policy): void {
    if (!policy || !policy.name || !policy.evaluate) {
      throw new Error(
        "Invalid policy: must have name and evaluate method"
      );
    }
    this.policies.push(policy);
  }

  /**
   * Evaluate all registered policies against a context
   * Returns on first denial (fail-fast), continues on allow
   */
  evaluateAll(context: PolicyContext): PolicyResult {
    this.evaluationLog = [];

    for (const policy of this.policies) {
      const result = policy.evaluate(context);

      // Log every evaluation
      this.evaluationLog.push({
        policyName: policy.name,
        allowed: result.allowed,
        reason: !result.allowed ? result.reason : undefined,
      });

      // Fail fast: first denial terminates evaluation
      if (!result.allowed) {
        return {
          allowed: false,
          reason: result.reason,
          policy: result.policy,
          evaluationChain: this.evaluationLog,
        } as PolicyResult;
      }
    }

    // All policies approved
    return {
      allowed: true,
      evaluationChain: this.evaluationLog,
    } as PolicyResult;
  }

  /**
   * Get the evaluation log from the last evaluation
   * Useful for audit logging and debugging
   */
  getEvaluationLog(): typeof this.evaluationLog {
    return [...this.evaluationLog];
  }

  /**
   * Get all registered policies
   */
  getPolicies(): Policy[] {
    return [...this.policies];
  }

  /**
   * Clear all registered policies
   * Useful for testing
   */
  clear(): void {
    this.policies = [];
    this.evaluationLog = [];
  }

  /**
   * Get count of registered policies
   */
  getPolicyCount(): number {
    return this.policies.length;
  }
}

/**
 * Create a default policy engine with standard policies
 */
export function createDefaultPolicyEngine(
  contentPolicy: Policy,
  usagePolicy: Policy
): PolicyEngine {
  const engine = new PolicyEngine();

  // Order matters: content policy first, then usage
  engine.registerPolicy(contentPolicy);
  engine.registerPolicy(usagePolicy);

  return engine;
}
