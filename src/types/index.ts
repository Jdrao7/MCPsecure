import { z } from "zod";

/**
 * Role-Based Access Control
 * Defines the three-tier hierarchy: admin > agent > user
 */
export const RoleSchema = z.enum(["admin", "agent", "user"]);
export type Role = z.infer<typeof RoleSchema>;

/**
 * Identity
 * Represents the authenticated subject making the request
 */
export const IdentitySchema = z.object({
  subjectId: z.string().min(1).max(256).describe("Unique subject identifier"),
  role: RoleSchema,
});
export type Identity = z.infer<typeof IdentitySchema>;

/**
 * MCP Request
 * Validated request to the MCP gateway
 */
export const MCPRequestSchema = z.object({
  identity: IdentitySchema,
  prompt: z.string().min(1).max(10000).describe("User prompt to send to LLM"),
  model: z.string().describe("Model identifier"),
  tool: z.string().max(100).optional().describe("Optional tool to use"),
  timestamp: z.number().describe("Request timestamp in milliseconds"),
});
export type MCPRequest = z.infer<typeof MCPRequestSchema>;

/**
 * MCP Response
 * Successful response from MCP gateway
 */
export const MCPResponseSchema = z.object({
  output: z.string().describe("Output from model execution"),
});
export type MCPResponse = z.infer<typeof MCPResponseSchema>;

/**
 * Policy Context
 * Context passed to policy evaluation engines
 */
export const PolicyContextSchema = z.object({
  prompt: z.string(),
  model: z.string(),
  tool: z.string().optional(),
  identityRole: RoleSchema,
  subjectId: z.string(),
});
export type PolicyContext = z.infer<typeof PolicyContextSchema>;

/**
 * Policy Result
 * Result of policy evaluation (ALLOW or DENY with reason)
 */
export const PolicyResultSchema = z.union([
  z.object({
    allowed: z.literal(true),
    evaluationChain: z.array(
      z.object({
        policyName: z.string(),
        allowed: z.boolean(),
        reason: z.string().optional(),
      })
    ).optional(),
  }),
  z.object({
    allowed: z.literal(false),
    reason: z.string(),
    policy: z.string(),
    evaluationChain: z.array(
      z.object({
        policyName: z.string(),
        allowed: z.boolean(),
        reason: z.string().optional(),
      })
    ).optional(),
  }),
]);
export type PolicyResult = z.infer<typeof PolicyResultSchema>;

/**
 * Audit Log Entry
 * Structured log of authorization decision
 */
export const AuditLogEntrySchema = z.object({
  timestamp: z.number().describe("Timestamp in milliseconds"),
  subjectId: z.string(),
  decision: z.enum(["allowed", "denied"]),
  reason: z.string().optional(),
  policy: z.string().optional(),
  model: z.string(),
  tool: z.string().optional(),
  duration_ms: z.number(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

/**
 * Permission types
 * String-based permission identifiers
 */
export const PermissionSchema = z.string();
export type Permission = z.infer<typeof PermissionSchema>;

/**
 * Role Permission Matrix
 * Maps roles to their allowed permissions
 */
export const RolePermissionMatrixSchema = z.record(RoleSchema, z.array(PermissionSchema));
export type RolePermissionMatrix = z.infer<typeof RolePermissionMatrixSchema>;