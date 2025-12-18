# Groq Available Models (December 2025)

## Quick Reference

### Available Models

| Model ID | Name | Speed | Context | Recommended For | Role Access |
|----------|------|-------|---------|-----------------|------------|
| `mixtral-8x7b-32768` | Mixtral 8x7B | ⚡⚡⚡ | 32K | General tasks, coding | User+ |
| `llama-3.1-8b-instant` | Llama 3.1 8B | ⚡⚡⚡⚡ | 128K | Quick responses | User+ |
| `llama-3.1-70b-versatile` | Llama 3.1 70B | ⚡⚡ | 128K | Complex reasoning | Agent+ |
| `llama-2-70b-chat` | Llama 2 70B | ⚡ | 4K | Legacy support | Agent+ |

---

## Model Details

### Mixtral 8x7B (Mixture of Experts)
```
ID: mixtral-8x7b-32768
Speed: Very Fast (⚡⚡⚡)
Context: 32,768 tokens
Pricing: Budget-friendly
Best for: General-purpose, coding, summarization
```

**Use case:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {"subjectId": "user1", "role": "user"},
    "prompt": "Write a Python function to calculate factorial",
    "model": "mixtral-8x7b-32768"
  }'
```

---

### Llama 3.1 8B Instant
```
ID: llama-3.1-8b-instant
Speed: Extremely Fast (⚡⚡⚡⚡)
Context: 128,000 tokens
Pricing: Very affordable
Best for: Quick responses, lightweight tasks
```

**Use case:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {"subjectId": "user2", "role": "user"},
    "prompt": "What is 2+2?",
    "model": "llama-3.1-8b-instant"
  }'
```

---

### Llama 3.1 70B Versatile
```
ID: llama-3.1-70b-versatile
Speed: Fast (⚡⚡)
Context: 128,000 tokens
Pricing: Standard
Best for: Complex reasoning, research, analysis
Access: Requires Agent role or higher
```

**Use case:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {"subjectId": "agent1", "role": "agent"},
    "prompt": "Analyze this dataset and provide insights",
    "model": "llama-3.1-70b-versatile"
  }'
```

---

### Llama 2 70B Chat
```
ID: llama-2-70b-chat
Speed: Slower (⚡)
Context: 4,096 tokens
Pricing: Higher cost
Best for: Legacy compatibility
Access: Requires Agent role or higher
```

---

## Role Access Matrix

| Role | Available Models |
|------|-----------------|
| **User** | • mixtral-8x7b-32768<br>• llama-3.1-8b-instant |
| **Agent** | • mixtral-8x7b-32768<br>• llama-3.1-8b-instant<br>• llama-3.1-70b-versatile<br>• llama-2-70b-chat |
| **Admin** | All models |

---

## Selection Guide

### I want **fast responses**
→ Use `llama-3.1-8b-instant`

### I want **best quality/speed balance**
→ Use `mixtral-8x7b-32768`

### I want **most powerful reasoning**
→ Use `llama-3.1-70b-versatile` (requires agent role)

### I need **long context** (>32K tokens)
→ Use `llama-3.1-8b-instant` or `llama-3.1-70b-versatile`

### I need **backward compatibility**
→ Use `llama-2-70b-chat`

---

## Error Handling

### Model Not Found
```
Error: 404 The model `gpt-3.5` does not exist
```

**Solution:** Use one of the available models listed above

### Insufficient Permissions
```
Error: 403 Request denied
Reason: Model llama-3.1-70b-versatile requires agent role
```

**Solution:** Use a model allowed for your role, or request higher privileges

### Token Limit Exceeded
```
Error: Context length exceeded
```

**Solution:** Reduce prompt size or use a model with larger context

---

## Configuration

### In route.ts
```typescript
// Models are checked against RBAC and policies
const request = MCPRequestSchema.parse({
  identity: { subjectId: "user", role: "user" },
  prompt: "...",
  model: "mixtral-8x7b-32768", // Must be valid Groq model
});
```

### Testing Models
```bash
# Test basic model
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"identity":{"subjectId":"test","role":"user"},"prompt":"test","model":"mixtral-8x7b-32768"}'

# Test advanced model (agent required)
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"identity":{"subjectId":"test","role":"agent"},"prompt":"test","model":"llama-3.1-70b-versatile"}'
```

---

## Common Issues

### Q: Why does `gpt-3.5-sonnet` not work?
A: That's OpenAI's model. Groq doesn't offer it. Use `mixtral-8x7b-32768` instead.

### Q: Can I use any model?
A: Only Groq models work. Your role determines which models you can access.

### Q: How do I add a new model?
A: Update `src/policy/rules/usage.ts` and add the model ID and required role.

---

## Updates (December 2025)

- ✅ Mixtral 8x7B - Available
- ✅ Llama 3.1 8B Instant - Available
- ✅ Llama 3.1 70B Versatile - Available
- ✅ Llama 2 70B Chat - Legacy support

For the latest available models, visit: https://console.groq.com/docs/models

---

## Next Steps

1. **Choose your model** from the available options
2. **Check your role** has access to that model
3. **Make API request** with the correct model ID
4. **Enjoy fast inference** with Groq!

---

**Last Updated:** December 18, 2025  
**Groq API Docs:** https://console.groq.com/docs
