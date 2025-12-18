import { PolicyContext, PolicyResult } from "@/types";

/**
 * Policy Interface
 * Defines the contract for policy evaluation
 * All policies must implement this interface
 */
export interface Policy {
  /** Unique name of the policy */
  name: string;

  /** Evaluate the policy with the given context */
  evaluate(context: PolicyContext): PolicyResult;
}

/**
 * Helper to create an ALLOW result
 */
export function allowResult(): PolicyResult {
  return { allowed: true };
}

/**
 * Helper to create a DENY result
 */
export function denyResult(
  reason: string,
  policy: string
): PolicyResult {
  return {
    allowed: false,
    reason,
    policy,
  };
}
