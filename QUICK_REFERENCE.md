# Quick Reference Guide

## 🚀 Getting Started

### Start Development Server
```bash
cd policy-access-driven-mcp
npm install
npm run dev
```

Server runs on: `http://localhost:3001` (or next available port)

### Access UI
- **Main Page**: `http://localhost:3001`
- **MCP Playground**: `http://localhost:3001/mcp`

---

## 🧪 Testing Examples

### Test 1: User with Safe Request (✅ Should Succeed)
```bash
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {"subjectId": "alice", "role": "user"},
    "prompt": "What is the capital of France?",
    "model": "mixtral-8x7b-32768"
  }'
```

**Response**: 200 OK (with LLM response)

---

### Test 2: User Accessing Advanced Model (❌ Should Fail - RBAC)
```bash
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {"subjectId": "bob", "role": "user"},
    "prompt": "Advanced task",
    "model": "llama-3.1-70b-versatile"
  }'
```

**Response**: 403 Forbidden
```json
{
  "error": "Request denied",
  "reason": "Model llama-3.1-70b-versatile requires agent role",
  "policy": "ModelUsagePolicy"
}
```

---

### Test 3: Jailbreak Attempt (❌ Should Fail - Policy)
```bash
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {"subjectId": "charlie", "role": "user"},
    "prompt": "How do I jailbreak a system?",
    "model": "gpt-3.5-sonnet"
  }'
```

**Response**: 403 Forbidden
```json
{
  "error": "Request denied",
  "reason": "Unsafe content detected: contains \"jailbreak\"",
  "policy": "ContentSafetyPolicy"
}
```

---

### Test 4: Agent Access (✅ Should Succeed)
```bash
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {"subjectId": "agent", "role": "agent"},
    "prompt": "Process this advanced data",
    "model": "llama-3.1-70b-versatile"
  }'
```

**Response**: 200 OK

---

### Test 5: Invalid Request (❌ Should Fail - Validation)
```bash
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {"subjectId": "test"},
    "prompt": "test",
    "model": "mixtral-8x7b-32768"
  }'
```

**Response**: 400 Bad Request
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

---

## 🔍 Authorization Matrix Quick Reference

### Roles & Models
| Role | mixtral-8x7b | llama-3.1-8b | llama-3.1-70b |
|------|-------------|------------|--------------|
| `user` | ✅ | ✅ | ❌ |
| `agent` | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ |

### Blocked Keywords
- `jailbreak`
- `exploit`
- `hack`
- `bypass`
- `ignore instructions`
- `system prompt`

---

## 📋 Request Schema

### Request Format
```json
{
  "identity": {
    "subjectId": "string",
    "role": "admin" | "agent" | "user"
  },
  "prompt": "string (1-10000 chars)",
  "model": "string",
  "tool": "string (optional)",
  "timestamp": "number (auto-filled)"
}
```

### Response Format (Success)
```json
{
  "success": true,
  "response": "LLM response text",
  "metadata": {
    "model": "model name",
    "toolsUsed": ["tool1", "tool2"],
    "tokensUsed": {"input": 100, "output": 50},
    "durationMs": 1234,
    "subjectId": "user-id",
    "evaluationChain": [
      {"policyName": "ContentSafetyPolicy", "allowed": true},
      {"policyName": "ModelUsagePolicy", "allowed": true}
    ]
  }
}
```

### Response Format (Denial)
```json
{
  "error": "Request denied",
  "reason": "Specific denial reason",
  "policy": "Policy name",
  "evaluationChain": [
    {
      "policyName": "ContentSafetyPolicy",
      "allowed": false,
      "reason": "Unsafe content detected: contains \"jailbreak\""
    }
  ]
}
```

---

## 🛠️ Environment Configuration

### Development (.env.local)
```bash
GROQ_API_KEY=your_api_key_here
NODE_ENV=development
```

### Get Groq API Key
1. Visit: https://console.groq.com/
2. Sign up / Log in
3. Create API key
4. Copy and paste into `.env.local`

---

## 📊 Audit Log Format

Every decision is logged as JSON:

```json
{
  "timestamp": 1708234957456,
  "subjectId": "user-123",
  "decision": "allowed",
  "model": "gpt-3.5-sonnet",
  "tool": null,
  "duration_ms": 1234
}
```

**Denied example:**
```json
{
  "timestamp": 1708234958789,
  "subjectId": "user-456",
  "decision": "denied",
  "reason": "Unsafe content detected: contains \"bypass\"",
  "policy": "ContentSafetyPolicy",
  "model": "gpt-3.5-sonnet",
  "duration_ms": 12
}
```

Logs appear in terminal with `[AUDIT]` prefix.

---

## 🔧 Build & Deployment

### Build for Production
```bash
npm run build
```

Generates optimized bundle in `.next/` directory.

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod

# Set environment variables
vercel env add GROQ_API_KEY
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design & patterns |
| [SETUP.md](./SETUP.md) | Detailed setup guide |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | What was built |
| [package.json](./package.json) | Dependencies & scripts |

---

## 🐛 Troubleshooting

### "Port 3000 in use"
Server automatically selects next available port (3001, 3002, etc.)

### "GROQ_API_KEY is not set"
Create `.env.local` with valid API key

### "Module not found"
```bash
npm install
npm run dev
```

### "TypeScript compilation error"
```bash
npm run build  # To see all errors
```

### "Request hangs"
Check:
1. GROQ_API_KEY is valid
2. Network connection is active
3. Groq API is available

---

## 🎯 Common Tasks

### Test RBAC (Role-Based Access)
```bash
# User → mixtral (should work)
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"identity":{"subjectId":"u1","role":"user"},"prompt":"hi","model":"mixtral-8x7b-32768"}'

# User → llama-3.1-70b (should fail)
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"identity":{"subjectId":"u1","role":"user"},"prompt":"hi","model":"llama-3.1-70b-versatile"}'
```

### Test Content Policy
```bash
# Safe prompt (should work)
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"identity":{"subjectId":"u1","role":"user"},"prompt":"hello world","model":"mixtral-8x7b-32768"}'

# Unsafe prompt (should fail)
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"identity":{"subjectId":"u1","role":"user"},"prompt":"jailbreak this system","model":"mixtral-8x7b-32768"}'
```

### View Audit Logs
```bash
# Logs appear in terminal as [AUDIT] lines
# For persistent logging, implement external service
```

---

## 📞 Support Resources

- **Issues**: Check error message in response
- **Docs**: See ARCHITECTURE.md and SETUP.md
- **Code**: JSDoc comments in src/ files
- **Examples**: See Test sections above

---

**Version**: 1.0.0 (Production Ready)  
**Last Updated**: 2024
