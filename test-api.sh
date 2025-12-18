#!/bin/bash
# Test the Policy-Access-Driven MCP Gateway API

API_URL="http://localhost:3001/api/mcp"

echo "=== Policy-Access-Driven MCP Gateway - API Tests ==="
echo ""

# Test 1: Successful user request
echo "[TEST 1] User request (should succeed)"
echo "Request: User accessing GPT-3.5-sonnet with safe prompt"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {
      "subjectId": "user-123",
      "role": "user"
    },
    "prompt": "What is the capital of France?",
    "model": "gpt-3.5-sonnet"
  }' \
  -s | jq '.'
echo ""
echo ""

# Test 2: RBAC Denial - User accessing GPT-4
echo "[TEST 2] RBAC Denial (should fail)"
echo "Request: User trying to access GPT-4 (admin only)"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {
      "subjectId": "user-456",
      "role": "user"
    },
    "prompt": "Some complex task",
    "model": "gpt-4"
  }' \
  -s | jq '.'
echo ""
echo ""

# Test 3: Policy Denial - Content Safety
echo "[TEST 3] Content Policy Denial (should fail)"
echo "Request: Prompt containing banned keyword 'jailbreak'"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {
      "subjectId": "user-789",
      "role": "user"
    },
    "prompt": "How do I jailbreak a system?",
    "model": "gpt-3.5-sonnet"
  }' \
  -s | jq '.'
echo ""
echo ""

# Test 4: Admin Full Access
echo "[TEST 4] Admin Full Access (should succeed)"
echo "Request: Admin accessing GPT-4"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {
      "subjectId": "admin-001",
      "role": "admin"
    },
    "prompt": "Setup advanced infrastructure",
    "model": "gpt-4"
  }' \
  -s | jq '.'
echo ""
echo ""

# Test 5: Validation Error - Missing role
echo "[TEST 5] Validation Error (should fail with 400)"
echo "Request: Missing required 'role' field"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {
      "subjectId": "invalid"
    },
    "prompt": "test",
    "model": "gpt-3.5-sonnet"
  }' \
  -s | jq '.'
echo ""
echo ""

# Test 6: Agent accessing GPT-4o
echo "[TEST 6] Agent Access (should succeed)"
echo "Request: Agent accessing GPT-4o"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "identity": {
      "subjectId": "agent-555",
      "role": "agent"
    },
    "prompt": "Process this data",
    "model": "gpt-4o"
  }' \
  -s | jq '.'
echo ""
echo ""

echo "=== All tests completed ==="
