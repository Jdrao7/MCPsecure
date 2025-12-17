import { Policy, PolicyContext, PolicyResult } from "@/policy/policy";


export class ContentPolicy implements Policy {
name = "ContentSafetyPolicy";


evaluate(context: PolicyContext): PolicyResult {
const banned = ["hack", "exploit", "bypass"];


if (banned.some(word => context.prompt.toLowerCase().includes(word))) {
return {
allowed: false,
reason: "Unsafe content detected",
policy: this.name
};
}


return { allowed: true };
}
}