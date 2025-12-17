import { Policy, PolicyContext, PolicyResult } from "@/policy/policy";


export class PolicyEngine {
constructor(private readonly policies: Policy[]) {}


evaluate(context: PolicyContext): PolicyResult {
for (const policy of this.policies) {
const result = policy.evaluate(context);
if (!result.allowed) return result;
}
return { allowed: true };
}
}