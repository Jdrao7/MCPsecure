import { Policy, allowResult, denyResult } from "@/policy/policy";
import { PolicyContext, PolicyResult, Role } from "@/types";

/**
 * Model Usage Policy
 * Restricts access to specific models based on user role
 * Enforced after RBAC but before execution
 */
export class UsagePolicy implements Policy {
  name = "ModelUsagePolicy";

  /**
   * Model access matrix by role
   * Maps models to the minimum required role
   * Based on Groq available models (Dec 2025)
   */
  private modelRoleMatrix: Record<string, Role> = {
    // Basic models - fast, accessible to all users
    "llama-3.1-8b-instant": "user",
    // Advanced models - better reasoning, agents and admins
    "llama-3.3-70b-versatile": "agent",
    // Safety/moderation model - guard model, agents and admins
    "meta-llama/llama-guard-4-12b": "agent",
  };

  /**
   * Evaluate if role can use the requested model
   */
  evaluate(context: PolicyContext): PolicyResult {
    const requiredRole = this.modelRoleMatrix[context.model];

    // If model not configured, allow it (unknown models pass through)
    if (!requiredRole) {
      return allowResult();
    }

    // Check if the user's role meets the requirement
    if (!this.roleMetRequirement(context.identityRole, requiredRole)) {
      return denyResult(
        `Model ${context.model} requires ${requiredRole} role`,
        this.name
      );
    }

    return allowResult();
  }

  /**
   * Check if a role meets the minimum requirement
   * Using role hierarchy: admin > agent > user
   */
  private roleMetRequirement(userRole: Role, minRequired: Role): boolean {
    const hierarchy: Record<Role, number> = {
      admin: 3,
      agent: 2,
      user: 1,
    };

    return hierarchy[userRole] >= hierarchy[minRequired];
  }

  /**
   * Set the minimum required role for a model
   * Useful for dynamic policy updates
   */
  setModelRequirement(model: string, minRole: Role): void {
    this.modelRoleMatrix[model] = minRole;
  }

  /**
   * Get the minimum required role for a model
   */
  getModelRequirement(model: string): Role | undefined {
    return this.modelRoleMatrix[model];
  }

  /**
   * Get all model-role mappings
   */
  getModelMatrix(): Record<string, Role> {
    return { ...this.modelRoleMatrix };
  }
}
