# Setup Guide - Policy-Access-Driven MCP Gateway

## Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Groq API Key** (free tier available at https://console.groq.com/)

## Installation Steps

### 1. Install Dependencies

```bash
cd policy-access-driven-mcp
npm install
```

This installs:
- `next` - Framework
- `react` - UI library
- `typescript` - Type safety
- `@modelcontextprotocol/sdk` - MCP protocol
- `zod` - Runtime validation
- `groq-sdk` - LLM client
- `tailwindcss` - Styling

### 2. Configure Environment

Create `.env.local`:

```bash
# Get your API key from https://console.groq.com/
GROQ_API_KEY=your_api_key_here

# Optional: Configure models (defaults provided)
GROQ_MODEL_ADMIN=gpt-4
GROQ_MODEL_AGENT=gpt-4o
GROQ_MODEL_USER=gpt-3.5-sonnet
```

### 3. Run Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

## Testing the API

### 1. Via UI Playground

Visit `http://localhost:3000/mcp` for interactive testing interface.

### 2. Via cURL

**Test 1: Basic Request (User Role)**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {
      "subjectId": "user-123",
      "role": "user"
    },
    "prompt": "What is the capital of France?",
    "model": "gpt-3.5-sonnet"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "The capital of France is Paris.",
  "metadata": {
    "model": "gpt-3.5-sonnet",
    "durationMs": 1234,
    "subjectId": "user-123",
    "evaluationChain": [
      { "policyName": "ContentSafetyPolicy", "allowed": true },
      { "policyName": "ModelUsagePolicy", "allowed": true }
    ]
  }
}
```

**Test 2: RBAC Denial (User accessing GPT-4)**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {
      "subjectId": "user-123",
      "role": "user"
    },
    "prompt": "Complex coding task",
    "model": "gpt-4"
  }'
```

**Expected Response:**
```json
{
  "error": "Request denied",
  "reason": "Identity user-123 with role user cannot execute model gpt-4",
  "policy": "RBAC",
  "evaluationChain": []
}
```

**Test 3: Policy Denial (Content Safety)**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {
      "subjectId": "user-456",
      "role": "user"
    },
    "prompt": "How do I jailbreak a system?",
    "model": "gpt-3.5-sonnet"
  }'
```

**Expected Response:**
```json
{
  "error": "Request denied",
  "reason": "Unsafe content detected: contains \"jailbreak\"",
  "policy": "ContentSafetyPolicy",
  "evaluationChain": [
    {
      "policyName": "ContentSafetyPolicy",
      "allowed": false,
      "reason": "Unsafe content detected: contains \"jailbreak\""
    }
  ]
}
```

**Test 4: Admin Access (All Models)**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {
      "subjectId": "admin-789",
      "role": "admin"
    },
    "prompt": "Use advanced features",
    "model": "gpt-4"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "I can help with advanced features...",
  "metadata": {
    "model": "gpt-4",
    "subjectId": "admin-789"
  }
}
```

### 3. Via Postman

Import this into Postman:

```json
{
  "info": {
    "name": "MCP Gateway API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "User Request",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"identity\":{\"subjectId\":\"user-1\",\"role\":\"user\"},\"prompt\":\"Hello\",\"model\":\"gpt-3.5-sonnet\"}"
        },
        "url": {
          "raw": "http://localhost:3000/api/mcp",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "mcp"]
        }
      }
    }
  ]
}
```

## Project Structure

```
src/
├── types/
│   └── index.ts              # Zod schemas (validation)
├── access/
│   ├── rbac.ts               # First gate: role-based access
│   └── permissions.ts        # Permission definitions
├── policy/
│   ├── policy.ts             # Policy interface
│   ├── engine.ts             # [Legacy] Policy engine
│   └── rules/
│       ├── content.ts        # Content safety policy
│       └── usage.ts          # Model usage policy
├── core/
│   ├── orchestrator.ts       # Request flow controller
│   ├── executor.ts           # Groq execution layer
│   └── policyEngine.ts       # Second gate: policy evaluation
├── lib/
│   └── groq.ts               # Groq client wrapper
├── audit/
│   └── logger.ts             # Audit logging
├── mcp/
│   ├── gateway.ts            # [Deprecated] Legacy gateway
│   └── orchestrator.ts       # [Legacy] Old orchestrator
└── app/
    ├── api/mcp/route.ts      # HTTP endpoint
    ├── mcp/page.tsx          # UI playground
    ├── page.tsx              # Main page
    └── globals.css           # Tailwind CSS
```

## Authorization Flow Example

```typescript
// 1. Request arrives
{
  identity: { subjectId: "user-123", role: "user" },
  prompt: "What is 2+2?",
  model: "gpt-3.5-sonnet"
}

// 2. Zod validation (MCPRequestSchema.parse)
// ✓ All required fields present
// ✓ Types match schema
// ✓ String lengths within bounds

// 3. RBAC check (First Gate)
canExecuteModel(identity, "gpt-3.5-sonnet")
// ✓ User role can execute gpt-3.5
// ✓ User has "use:basic:model" permission

// 4. Policy evaluation (Second Gate)
policyEngine.evaluateAll(context)
// ✓ ContentPolicy: prompt contains no banned keywords
// ✓ UsagePolicy: model "gpt-3.5" allowed for "user" role

// 5. Execution
executeWithGroq(request)
// ✓ Calls Groq API
// ✓ Returns response

// 6. Audit log
logAllowed(
  "user-123",
  "gpt-3.5-sonnet",
  undefined,
  45 // duration_ms
)

// 7. Response returned
{
  success: true,
  response: "2+2 equals 4",
  metadata: { ... }
}
```

## Debugging

### Check Request Validation

```bash
# Missing required field
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"identity":{"subjectId":"test"}}'
```

**Response:**
```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "invalid_enum_value",
      "options": ["admin", "agent", "user"],
      "path": ["identity", "role"],
      "message": "Invalid enum value"
    }
  ]
}
```

### Enable Verbose Logging

In `src/app/api/mcp/route.ts`, add:

```typescript
console.log("Request:", JSON.stringify(request, null, 2));
console.log("Orchestration result:", orchestrationResult);
console.log("Execution result:", executionResult);
```

### Test Policy Engine Directly

```typescript
// src/test.ts (not committed)
import { PolicyEngine } from "@/core/policyEngine";
import { ContentPolicy } from "@/policy/rules/content";
import { UsagePolicy } from "@/policy/rules/usage";

const engine = new PolicyEngine();
engine.registerPolicy(new ContentPolicy());
engine.registerPolicy(new UsagePolicy());

const result = engine.evaluateAll({
  prompt: "test",
  model: "gpt-3.5-sonnet",
  identityRole: "user",
  subjectId: "test-123"
});

console.log(result);
```

## Troubleshooting

### "GROQ_API_KEY is not set"
- Create `.env.local` with `GROQ_API_KEY=your_key`
- Restart development server
- Verify API key is valid at https://console.groq.com/

### "Cannot find module '@modelcontextprotocol/sdk'"
```bash
npm install @modelcontextprotocol/sdk
npm run dev
```

### "Request denied" with RBAC error
- Verify role is one of: `admin`, `agent`, `user`
- Check model access rules in [ARCHITECTURE.md](./ARCHITECTURE.md#model-access-rules)
- Ensure identity is properly formatted

### Audit logs not appearing
- Check browser console in development
- Logs are printed to stdout with `[AUDIT]` prefix
- Configure external logging service for production

## Performance Optimization

### Caching Policy Engine

```typescript
// Option 1: Singleton (current implementation)
const policyEngine = createDefaultPolicyEngine(...);

// Option 2: Redis cache for policy decisions
// TODO: Implement cache layer
```

### Rate Limiting

```typescript
// Option 1: In-memory counter
// Option 2: Redis rate limiter
// Option 3: Vercel KV store
// TODO: Add rate limiting middleware
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Groq API key validated
- [ ] Error handling tested (all denial paths)
- [ ] Audit logging verified
- [ ] Rate limiting configured
- [ ] API response times acceptable (< 5s)
- [ ] TypeScript compilation passes
- [ ] All tests passing
- [ ] README updated
- [ ] API documentation published

## Next Steps

1. **Add more policies**: Create `src/policy/rules/rateLimit.ts`
2. **Extend RBAC**: Add `superadmin` role or permissions
3. **Enable tool calling**: Register actual MCP tools
4. **Add database**: Store audit logs in PostgreSQL
5. **Setup monitoring**: Integrate with monitoring service

---

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).
