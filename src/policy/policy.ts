export type PolicyResult =
| { allowed: true }
| { allowed: false; reason: string; policy: string };


export type PolicyContext = {
prompt: string;
model: string;
tool?: string;
identityRole: string;
};


export interface Policy {
name: string;
evaluate(context: PolicyContext): PolicyResult;
}