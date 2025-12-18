# Policy-Access-Driven MCP Gateway

A production-grade Model Context Protocol (MCP) gateway built with Next.js, featuring multi-layer authorization, policy enforcement, and comprehensive audit logging.

## Architecture Overview

The system implements a **strict, fail-fast authorization pipeline**:

```
Request
  ↓
[1] Zod Validation (MCPRequestSchema)
  ↓
[2] RBAC First Gate (canExecuteModel, canUseTool)
  ↓
[3] Policy Engine Second Gate (ContentPolicy, UsagePolicy)
  ↓
[4] Groq Execution (with tool calling)
  ↓
[5] Audit Logging (structured JSON)
  ↓
Response
```

**No step may be skipped. No shortcuts.**

## Core Modules

### 1. Authorization Layer

#### RBAC (`src/access/rbac.ts`)
- **First authorization gate** - enforced before any policy evaluation
- Role hierarchy: `admin` (3) > `agent` (2) > `user` (1)
- Functions:
  - `canExecuteModel(identity, model)` - Model-specific access control
  - `canUseTool(identity, tool)` - Tool whitelist enforcement
  - `hasPermission(identity, permission)` - Permission checker
  - `hasHigherPrivilege(roleA, roleB)` - Role comparison

#### Policy Engine (`src/core/policyEngine.ts`)
- **Second authorization gate** - evaluated after RBAC passes
- Orchestrates multiple policies in strict order
- Fail-fast: first denial terminates evaluation
- Policies:
  - **ContentPolicy** (`src/policy/rules/content.ts`) - Blocked keywords detection
  - **UsagePolicy** (`src/policy/rules/usage.ts`) - Model restrictions by role

### 2. Orchestrator (`src/core/orchestrator.ts`)
- Controls the complete request flow
- Validates all gates in order
- Logs all authorization decisions
- Returns detailed evaluation chain for debugging

### 3. Executor (`src/core/executor.ts`)
- Executes approved requests via Groq
- Converts MCP tools to Groq format
- Handles tool calling responses
- Supports test mode for local development

### 4. Audit Logger (`src/audit/logger.ts`)
- Structured JSON logging for compliance
- Tracks every authorization decision
- Convenience functions: `logAllowed()`, `logDenied()`
- Extensible for external logging services

## Type Safety with Zod

All inputs validated at boundaries using Zod schemas (`src/types/index.ts`):

```typescript
// Schema validation ensures type safety + runtime validation
const request = MCPRequestSchema.parse(body);
```

**Schemas:**
- `IdentitySchema` - Authenticated subject
- `MCPRequestSchema` - API request validation
- `PolicyContextSchema` - Policy evaluation context
- `PolicyResultSchema` - Policy decision format
- `AuditLogEntrySchema` - Audit log structure

## API Endpoint

### POST `/api/mcp`

**Request:**
```json
{
  "identity": {
    "subjectId": "user-123",
    "role": "admin"
  },
  "prompt": "What is 2+2?",
  "model": "groq-3.5-sonnet",
  "tool": "calculator"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "response": "2+2 equals 4",
  "metadata": {
    "model": "groq-3.5-sonnet",
    "toolsUsed": ["calculator"],
    "tokensUsed": { "input": 10, "output": 5 },
    "durationMs": 234,
    "subjectId": "user-123",
    "evaluationChain": [
      { "policyName": "ContentSafetyPolicy", "allowed": true },
      { "policyName": "ModelUsagePolicy", "allowed": true }
    ]
  }
}
```

**Authorization Denied (403):**
```json
{
  "error": "Request denied",
  "reason": "Model gpt-4 requires admin role",
  "policy": "ModelUsagePolicy",
  "evaluationChain": [
    { "policyName": "ContentSafetyPolicy", "allowed": true },
    { "policyName": "ModelUsagePolicy", "allowed": false, "reason": "..." }
  ]
}
```

**Validation Error (400):**
```json
{
  "error": "Invalid request",
  "details": [
    { "path": ["identity", "role"], "message": "Invalid role" }
  ]
}
```

## Role Permission Matrix

| Permission | Admin | Agent | User |
|-----------|-------|-------|------|
| `use:any:model` | ✓ | ✗ | ✗ |
| `use:any:tool` | ✓ | ✗ | ✗ |
| `use:basic:model` | ✓ | ✓ | ✓ |
| `use:basic:tool` | ✓ | ✓ | ✓ |

## Model Access Rules

| Model | Required Role |
|-------|--------------|
| `gpt-3.5` | User |
| `gpt-4o` | Agent |
| `gpt-4` | Admin |

## Content Policy Rules

Blocked keywords (case-insensitive):
- `hack`, `exploit`, `bypass`
- `jailbreak`, `ignore instructions`
- `system prompt`

Extensible via `addBannedKeyword(keyword)`.

## Development

### Environment Setup

```bash
# Install dependencies
npm install

# Set Groq API key
echo "GROQ_API_KEY=your_api_key" > .env.local

# Run development server
npm run dev
```

### Testing Flow

1. **Local Testing** (no Groq calls):
   ```typescript
   const executor = createExecutor({ useTest: true });
   ```

2. **Policy Testing**:
   ```typescript
   const policyEngine = createDefaultPolicyEngine(
     new ContentPolicy(),
     new UsagePolicy()
   );
   const result = policyEngine.evaluateAll(context);
   ```

3. **Full Integration**:
   ```bash
   curl -X POST http://localhost:3000/api/mcp \
     -H "Content-Type: application/json" \
     -d '{
       "identity": {"subjectId": "test", "role": "user"},
       "prompt": "Hi",
       "model": "gpt-3.5-sonnet"
     }'
   ```

## Deployment

### Vercel Requirements Met

✓ **Stateless** - No in-memory state persistence  
✓ **HTTP-only** - No stdio transports  
✓ **TypeScript strict** - Type-safe codebase  
✓ **Zod validation** - Runtime type checking  
✓ **No long-running processes** - Synchronous request/response  

```bash
# Deploy to Vercel
vercel deploy --prod
```

## Audit Trail Example

```
[AUDIT] {"timestamp":1708234956123,"subjectId":"user-123","decision":"denied","reason":"Unsafe content detected: contains \"jailbreak\"","policy":"ContentSafetyPolicy","model":"gpt-3.5-sonnet","duration_ms":12}

[AUDIT] {"timestamp":1708234957456,"subjectId":"admin-456","decision":"allowed","model":"gpt-4","tool":"code_executor","duration_ms":8954}
```

## Future Enhancements

- [ ] External logging service integration (DataDog, Splunk)
- [ ] Rate limiting per subject
- [ ] Time-based access restrictions
- [ ] Tool execution response validation
- [ ] ML-based anomaly detection in audit logs
- [ ] Multi-provider LLM routing (OpenAI, Anthropic, etc.)

## References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [Groq API](https://console.groq.com/)
- [Zod Documentation](https://zod.dev/)

---

**Built with enterprise-grade security and compliance in mind.**
