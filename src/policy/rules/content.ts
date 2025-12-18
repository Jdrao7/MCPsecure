import { Policy, allowResult, denyResult } from "@/policy/policy";
import { PolicyContext, PolicyResult } from "@/types";

/**
 * Content Safety Policy
 * SECOND GATE: Blocks prompts containing dangerous keywords/patterns
 * Evaluated after RBAC but before tool execution
 */
export class ContentPolicy implements Policy {
  name = "ContentSafetyPolicy";

  /**
   * Banned keywords that trigger content blocking
   * Case-insensitive matching
   */
  private bannedKeywords = [
    "hack",
    "exploit",
    "bypass",
    "jailbreak",
    "ignore instructions",
    "system prompt",
  ];

  /**
   * Evaluate if prompt contains banned content
   */
  evaluate(context: PolicyContext): PolicyResult {
    // Convert prompt to lowercase for case-insensitive matching
    const promptLower = context.prompt.toLowerCase();

    // Check for banned keywords
    for (const keyword of this.bannedKeywords) {
      if (promptLower.includes(keyword)) {
        return denyResult(
          `Unsafe content detected: contains "${keyword}"`,
          this.name
        );
      }
    }

    return allowResult();
  }

  /**
   * Add a keyword to the banned list
   * Useful for dynamic policy updates
   */
  addBannedKeyword(keyword: string): void {
    if (!this.bannedKeywords.includes(keyword.toLowerCase())) {
      this.bannedKeywords.push(keyword.toLowerCase());
    }
  }

  /**
   * Get all banned keywords
   */
  getBannedKeywords(): string[] {
    return [...this.bannedKeywords];
  }
}