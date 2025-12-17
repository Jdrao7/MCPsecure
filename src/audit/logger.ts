export function logDecision(entry: {
subjectId: string;
decision: "ALLOW" | "DENY";
reason?: string;
policy?: string;
}) {
console.log("[AUDIT]", {
...entry,
timestamp: new Date().toISOString(),
});
}