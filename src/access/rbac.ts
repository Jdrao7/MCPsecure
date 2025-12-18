import { Identity, Role, RolePermissionMatrix } from "@/types";

/**
 * RBAC - Role-Based Access Control
 * FIRST GATE: Executed before all policies
 * Determines if a subject has the basic permission to use a model
 */

/**
 * Permission matrix: defines what each role can do
 * This is the authoritative source of role capabilities
 */
export const ROLE_PERMISSION_MATRIX: RolePermissionMatrix = {
  admin: ["use:any:model", "use:any:tool", "bypass:content:policy"],
  agent: ["use:basic:model", "use:limited:tool"],
  user: ["use:basic:model"],
};

/**
 * Check if identity has a specific permission
 * @param identity The identity to check
 * @param permission The permission to verify
 * @returns true if permission is granted
 */
export function hasPermission(identity: Identity, permission: string): boolean {
  const permissions = ROLE_PERMISSION_MATRIX[identity.role] || [];
  return permissions.includes(permission);
}

/**
 * Check if identity can execute a model request
 * FIRST GATE of authorization
 * @param identity The identity making the request
 * @param model The model being requested
 * @returns true if RBAC check passes
 */
export function canExecuteModel(identity: Identity, model: string): boolean {
  // Admin can use any model
  if (hasPermission(identity, "use:any:model")) {
    return true;
  }

  // Non-admin can only use basic models (Llama 3.1 8B)
  if (hasPermission(identity, "use:basic:model")) {
    // Allow basic models for user and agent
    const basicModels = [
      "llama-3.1-8b-instant",
    ];
    const agentModels = [
      "llama-3.1-70b-versatile",
    ];
    
    if (basicModels.includes(model)) {
      return true;
    }
    
    // Agent can use agent models
    if (agentModels.includes(model) && identity.role === "agent") {
      return true;
    }
  }

  return false;
}

/**
 * Check if identity can use a tool
 * @param identity The identity making the request
 * @param tool The tool being requested
 * @returns true if tool access is allowed
 */
export function canUseTool(identity: Identity, tool: string): boolean {
  // Admin can use any tool
  if (hasPermission(identity, "use:any:tool")) {
    return true;
  }

  // Non-admin can only use limited tools
  if (hasPermission(identity, "use:limited:tool")) {
    // Whitelist of allowed tools for non-admin
    const allowedTools = ["web_search", "calculator"];
    return allowedTools.includes(tool);
  }

  return false;
}

/**
 * Get all permissions for a role
 * Useful for listing capabilities
 */
export function getPermissions(role: Role): string[] {
  return ROLE_PERMISSION_MATRIX[role] || [];
}

/**
 * Check if role has higher privilege
 * Returns true if roleA >= roleB in hierarchy
 */
export function hasHigherPrivilege(roleA: Role, roleB: Role): boolean {
  const hierarchy: Record<Role, number> = {
    admin: 3,
    agent: 2,
    user: 1,
  };
  return hierarchy[roleA] >= hierarchy[roleB];
}
