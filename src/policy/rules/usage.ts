import { Policy, PolicyContext, PolicyResult } from "@/policy/policy";


export class UsagePolicy implements Policy {
name = "ModelUsagePolicy";


evaluate(context: PolicyContext): PolicyResult {
if (context.identityRole !== "admin" && context.model === "gpt-4") {
return {
allowed: false,
reason: "Model restricted to admins",
policy: this.name
};
}


return { allowed: true };
}
}