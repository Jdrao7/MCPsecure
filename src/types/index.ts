export type Identity = {
subjectId: string;
role: "admin" | "user" | "agent";
};


export type MCPRequest = {
identity: Identity;
prompt: string;
model: string;
tool?: string;
timestamp: number;
};


export type MCPResponse = {
output: string;
};