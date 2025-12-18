/**
 * Legacy permissions file - kept for backward compatibility
 * New code should use rbac.ts directly
 */

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["use:any:model", "use:any:tool"],
  agent: ["use:basic:model", "use:limited:tool"],
  user: ["use:basic:model"],
};