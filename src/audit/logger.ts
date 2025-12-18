import { AuditLogEntrySchema } from "@/types";
import { z } from "zod";

/**
 * Audit Logger
 *
 * Centralized audit logging for compliance and monitoring.
 * All authorization decisions are logged with full context.
 *
 * Format: Structured JSON for machine parsing
 * Destination: Console (development), could be extended to file/database
 */

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

/**
 * Log an authorization decision with full context
 *
 * @param entry Audit log entry with decision details
 */
export function logDecision(entry: Omit<AuditLogEntry, "timestamp">): void {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: Date.now(),
  };

  // Validate the log entry
  const validated = AuditLogEntrySchema.parse(logEntry);

  // Log as structured JSON
  console.log(`[AUDIT] ${JSON.stringify(validated)}`);

  // TODO: Future enhancements
  // - Send to external logging service (DataDog, Splunk, etc.)
  // - Store in database for compliance audits
  // - Real-time alerting for suspicious patterns
}

/**
 * Convenience function to log an allowed decision
 */
export function logAllowed(
  subjectId: string,
  model: string,
  tool?: string,
  duration_ms: number = 0
): void {
  logDecision({
    subjectId,
    decision: "allowed",
    model,
    tool,
    duration_ms,
  });
}

/**
 * Convenience function to log a denied decision
 */
export function logDenied(
  subjectId: string,
  reason: string,
  policy: string,
  model: string,
  tool?: string,
  duration_ms: number = 0
): void {
  logDecision({
    subjectId,
    decision: "denied",
    reason,
    policy,
    model,
    tool,
    duration_ms,
  });
}

/**
 * Convenience function to log a denied decision with full context
 */
export function logDeniedWithContext(
  subjectId: string,
  reason: string,
  policy: string,
  model: string,
  tool?: string | undefined,
  duration_ms: number = 0
): void {
  logDecision({
    subjectId,
    decision: "denied",
    reason,
    policy,
    model,
    tool,
    duration_ms,
  });
}

/**
 * Batch log multiple entries
 * Useful for bulk operations
 */
export function logBatch(
  entries: Omit<AuditLogEntry, "timestamp">[]
): void {
  entries.forEach((entry) => logDecision(entry));
}