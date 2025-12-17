export const ROLE_PERMISSIONS: Record<string, string[]> = {
admin: ["use:any:model", "use:any:tool"],
user: ["use:basic:model"],
agent: ["use:basic:model", "use:limited:tool"],
};