# Product Requirements Document (PRD)
## Policy-Access-Driven MCP (Model Context Protocol) Gateway

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Active Development  
**Audience:** Engineers, AI/ML Teams, Security & Compliance

---

## 1. Executive Summary

### 1.1 Product Overview
The **Policy-Access-Driven MCP Gateway** is an enterprise-grade API middleware that manages secure access to Large Language Models (LLMs) and AI tools through a **Model Context Protocol (MCP)** interface. The system enforces fine-grained **role-based access control (RBAC)**, **content policies**, and **usage policies** while maintaining comprehensive audit trails for compliance and security monitoring.

### 1.2 Core Value Proposition
- **Secure AI Access**: Enforce role-based permissions for AI model usage
- **Policy Enforcement**: Block unsafe content and restrict model access by user role
- **Compliance Ready**: Complete audit logging of all requests and decisions
- **Developer Friendly**: Simple REST API with intuitive UI playground
- **Extensible Architecture**: Modular policy engine for custom rule implementation

### 1.3 Business Objectives
- Enable organizations to safely expose AI capabilities to internal teams
- Reduce security and compliance risks in AI usage
- Provide visibility into AI model consumption patterns
- Establish governance framework for enterprise AI deployments

---

## 2. Problem Statement

### 2.1 Current Challenges
**Security Risks:**
- Uncontrolled access to powerful AI models creates security vulnerabilities
- Lack of content filtering allows malicious prompts (jailbreaks, exploits)
- No visibility into who is using AI and for what purposes

**Compliance Issues:**
- Regulatory requirements (SOC 2, HIPAA, GDPR) demand audit trails
- Model usage must be tracked and restricted by role
- Content governance policies must be enforced programmatically

**Operational Pain Points:**
- Different teams have different AI capability needs
- Manual approval processes are slow and error-prone
- No standardized interface for AI access across the organization

### 2.2 Target Users
1. **Enterprise IT Teams** - Deploy and manage AI governance
2. **Security & Compliance Officers** - Monitor policy enforcement and audit logs
3. **Application Developers** - Integrate AI capabilities into applications
4. **Data Scientists & AI Engineers** - Access models within organizational constraints
5. **System Administrators** - Configure roles and policies

---

## 3. Goals & Success Metrics

### 3.1 Primary Goals
| Goal | Success Metric | Target |
|------|---|---|
| **Secure AI Access** | Zero unauthorized model access incidents | 100% |
| **Policy Compliance** | All blocked requests have valid policy reason | 100% |
| **Audit Completeness** | All requests logged with decision reason | 100% |
| **User Adoption** | Reduce direct model API access by | 80% |
| **Performance** | API response time (p99) | < 500ms |

### 3.2 Secondary Metrics
- Policy violation detection rate
- False positive rate in content filtering
- Administrator configuration time
- End-user adoption satisfaction

---

## 4. Feature Specifications

### 4.1 Role-Based Access Control (RBAC)

#### 4.1.1 Role Hierarchy
```
Role: admin
├─ Permissions:
│  ├─ use:any:model        (Access all models)
│  └─ use:any:tool         (Access all tools)
│
Role: agent
├─ Permissions:
│  ├─ use:basic:model      (GPT-3.5 only)
│  └─ use:limited:tool     (Specific tools)
│
Role: user
└─ Permissions:
   └─ use:basic:model      (GPT-3.5 only)
```

#### 4.1.2 Access Control Matrix
| Role | GPT-3.5 | GPT-4 | GPT-4o | Code Interpreter | Data Tools |
|------|---------|-------|--------|------------------|------------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| agent | ✅ | ❌ | ❌ | ✅ | ⚠️* |
| user | ✅ | ❌ | ❌ | ❌ | ❌ |

*Limited to non-sensitive data

#### 4.1.3 Implementation Details
- **Identity Resolution**: Subject ID + Role from request header
- **Permission Checking**: Before policy evaluation in orchestrator
- **Denial Behavior**: Return 403 Forbidden with "RBAC denied" reason
- **Extensibility**: Permission matrix loadable from external config

### 4.2 Content Policy Engine

#### 4.2.1 Content Safety Policy
**Policy Name:** ContentSafetyPolicy  
**Description:** Block prompts containing harmful keywords or patterns

**Blocked Keywords:**
```typescript
banned_patterns: ["hack", "exploit", "bypass", "jailbreak"]
```

**Trigger Condition:**
- Case-insensitive substring match in prompt
- Any match = DENY with "Unsafe content detected"

**Bypass Mechanism:**
- Admin role: Can bypass (future enhancement: explicit flag)
- Other roles: No bypass allowed

#### 4.2.2 Custom Policy Framework
Extensible for future policies:
- PII detection (SSN, email, credit card patterns)
- Prompt injection detection
- Language filtering
- Character limit enforcement
- Rate limiting per user/role

### 4.3 Usage Policy Engine

#### 4.3.1 Model Usage Policy
**Policy Name:** ModelUsagePolicy  
**Description:** Restrict access to premium models based on role

**Rules:**
```
IF model == "gpt-4" AND role != "admin"
  THEN DENY with "Model restricted to admins"

IF model == "gpt-4o" AND role NOT IN ["admin", "agent"]
  THEN DENY with "Model requires agent or admin role"
```

**Implementation:**
- Evaluated after RBAC check
- Blocking decision happens at policy engine level
- Non-blocking policies can be added (monitoring, cost tracking)

#### 4.3.2 Future Usage Policies
- Rate limiting (requests per hour/day by role)
- Cost-based quotas (monthly spending limits)
- Token limits per request
- Concurrent request caps

### 4.4 Audit & Logging

#### 4.4.1 Log Entry Structure
```typescript
interface AuditLogEntry {
  timestamp: ISO8601;        // When the decision was made
  subjectId: string;         // Who made the request
  decision: "ALLOW" | "DENY";
  reason?: string;           // Why it was denied
  policy?: string;           // Which policy blocked it
  model: string;
  tool?: string;
  promptHash?: string;       // SHA256 of prompt (optional)
  duration_ms: number;       // Processing time
}
```

#### 4.4.2 Log Output
- Console logging (development)
- File logging (production - configurable)
- Elasticsearch integration (future)
- Datadog/Splunk support (future)

#### 4.4.3 Retention & Compliance
- Minimum retention: 90 days
- Immutable log format
- Log integrity verification (future)

---

## 5. API Specification

### 5.1 POST /api/mcp

#### Request
```json
{
  "identity": {
    "subjectId": "user-1",
    "role": "user" | "agent" | "admin"
  },
  "prompt": "What is machine learning?",
  "model": "gpt-3.5" | "gpt-4" | "gpt-4o",
  "tool": "code_interpreter",  // optional
  "timestamp": 1702867200000
}
```

**Validation Rules:**
- `subjectId`: non-empty string, max 256 chars
- `role`: enum [user, agent, admin]
- `prompt`: string, min 1 char, max 10,000 chars
- `model`: enum [gpt-3.5, gpt-4, gpt-4o]
- `tool`: optional, string, max 100 chars

#### Response - Success (200)
```json
{
  "output": "Machine learning is a subset of artificial intelligence..."
}
```

#### Response - Denied (403)
```json
{
  "error": "Model restricted to admins"
}
```

**HTTP Status Codes:**
| Code | Scenario |
|------|----------|
| 200 | Request approved and executed |
| 403 | Access denied (RBAC/Policy violation) |
| 400 | Invalid request format |
| 500 | Server error |

### 5.2 GET /mcp (UI Playground)
- Interactive form to test the API
- Pre-configured role selector
- Real-time response display
- Policy explanation panel

---

## 6. System Architecture

### 6.1 Architecture Diagram (Text)
```
┌─────────────────────────────────────────────────────────┐
│                    Client Application                   │
├──────────────────────────────────────────────────────────┤
│              POST /api/mcp (Request)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────▼────────────────┐
        │   API Gateway (route.ts)      │
        │  - Request validation         │
        │  - Body parsing               │
        │  - Error handling             │
        └──────────────┬────────────────┘
                       │
        ┌──────────────▼────────────────────┐
        │  MCP Orchestrator               │
        │  (orchestrator.ts)              │
        │  - Orchestrates request flow    │
        │  - Delegates to policy engine   │
        └──────────────┬────────────────────┘
                       │
        ┌──────────────▼────────────────────────┐
        │  RBAC Check (rbac.ts)                │
        │  canExecute()                         │
        │  ✓ ALLOW → continue                   │
        │  ✗ DENY → return 403                  │
        └──────────────┬────────────────────────┘
                       │ (if ALLOW)
        ┌──────────────▼────────────────────────┐
        │  Policy Engine (engine.ts)           │
        │  - Evaluate ContentPolicy            │
        │  - Evaluate ModelUsagePolicy         │
        │  ✓ ALLOW → execute                    │
        │  ✗ DENY → return 403                  │
        └──────────────┬────────────────────────┘
                       │ (if ALLOW)
        ┌──────────────▼────────────────────────┐
        │  MCP SDK Executor (mcpSdkExecutor.ts)│
        │  - Execute model request             │
        │  - Return response                    │
        └──────────────┬────────────────────────┘
                       │
        ┌──────────────▼────────────────────┐
        │  Audit Logger (logger.ts)         │
        │  - Log decision + reason          │
        │  - Log timestamp + metadata       │
        └──────────────┬────────────────────┘
                       │
        ┌──────────────▼────────────────────┐
        │    Response (Success/Error)       │
        └──────────────────────────────────┘
```

### 6.2 Core Modules

| Module | Responsibility | Key Functions |
|--------|---|---|
| `gateway.ts` | Entry point | `mcpGateway()` |
| `orchestrator.ts` | Request orchestration | `handleMCP()` |
| `rbac.ts` | Role-based access | `canExecute()` |
| `engine.ts` | Policy evaluation | `PolicyEngine.evaluate()` |
| `policy.ts` | Policy interface | `Policy` interface |
| `rules/content.ts` | Content filtering | `ContentPolicy` |
| `rules/usage.ts` | Usage restrictions | `UsagePolicy` |
| `executor.ts` | Model execution | `executeWithMcpSDK()` |
| `logger.ts` | Audit logging | `logDecision()` |

### 6.3 Technology Stack
- **Runtime:** Node.js 20+
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **UI:** React 19 + Tailwind CSS 4
- **Frontend Build:** Turbopack
- **HTTP:** Next.js native (HTTP/1.1, HTTP/2 supported)

---

## 7. Data Models

### 7.1 Core Types
```typescript
// Identity
type Identity = {
  subjectId: string;
  role: "admin" | "user" | "agent";
};

// Request
type MCPRequest = {
  identity: Identity;
  prompt: string;
  model: string;
  tool?: string;
  timestamp: number;
};

// Response
type MCPResponse = {
  output: string;
};

// Policy Result
type PolicyResult = 
  | { allowed: true }
  | { allowed: false; reason: string; policy: string };

// Policy Context
type PolicyContext = {
  prompt: string;
  model: string;
  tool?: string;
  identityRole: string;
};

// Policy Interface
interface Policy {
  name: string;
  evaluate(context: PolicyContext): PolicyResult;
}
```

### 7.2 Permission Matrix
```typescript
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "use:any:model",
    "use:any:tool",
  ],
  agent: [
    "use:basic:model",
    "use:limited:tool",
  ],
  user: [
    "use:basic:model",
  ],
};
```

---

## 8. Security & Compliance

### 8.1 Security Measures
1. **Input Validation**
   - All inputs validated before processing
   - Prompt length limits enforced (max 10K chars)
   - Model name whitelisting

2. **Authorization**
   - RBAC enforced before policy evaluation
   - No privilege escalation paths
   - Role verification on every request

3. **Content Safety**
   - Keyword-based filtering for banned patterns
   - Case-insensitive matching
   - Extensible rule system

4. **Audit Trail**
   - All decisions logged immutably
   - Timestamp precision: milliseconds
   - Reason capture for all denials

### 8.2 Compliance Frameworks
- **SOC 2 Type II**: Audit logging, access controls
- **HIPAA**: Encryption in transit, audit trails
- **GDPR**: User consent tracking, data retention policies
- **ISO 27001**: Security controls, incident response

### 8.3 Future Security Enhancements
- End-to-end encryption for prompts
- Role-based encryption keys
- Multi-factor authentication (MFA) support
- API key rotation policies
- Rate limiting and DDoS protection
- Anomaly detection for unusual access patterns

---

## 9. User Flows

### 9.1 Happy Path: Admin Uses GPT-4
```
1. Admin (role: admin) submits prompt to POST /api/mcp
2. API validates request format ✓
3. RBAC check: admin has "use:any:model" ✓
4. PolicyEngine evaluates:
   - ContentPolicy: prompt clean ✓
   - ModelUsagePolicy: admin can use gpt-4 ✓
5. executeWithMcpSDK() runs model
6. Response returned: { output: "..." }
7. Audit log: ALLOW, timestamp, subjectId
```

### 9.2 Blocked Path: User Attempts GPT-4
```
1. User (role: user) submits GPT-4 request
2. API validates request format ✓
3. RBAC check: user missing "use:any:model" ✗
4. Decision: DENY
5. Response: 403 { error: "Access denied" }
6. Audit log: DENY, reason: "RBAC denied", timestamp
```

### 9.3 Content Filter Path: Jailbreak Attempt
```
1. User submits prompt with "exploit" keyword
2. API validates request format ✓
3. RBAC check: user has "use:basic:model" ✓
4. PolicyEngine evaluates:
   - ContentPolicy: prompt contains "exploit" ✗
5. Decision: DENY
6. Response: 403 { error: "Unsafe content detected" }
7. Audit log: DENY, reason: "Unsafe content detected", policy: "ContentSafetyPolicy"
```

---

## 10. Configuration & Deployment

### 10.1 Environment Configuration
```env
# MCP Configuration
MCP_MODEL_WHITELIST=gpt-3.5,gpt-4,gpt-4o
MCP_DEFAULT_ROLE=user

# Policy Configuration
POLICY_CONTENT_BANNED_KEYWORDS=hack,exploit,bypass
POLICY_GPT4_ALLOWED_ROLES=admin

# Audit Configuration
AUDIT_LOG_LEVEL=INFO
AUDIT_LOG_FORMAT=JSON
AUDIT_LOG_DESTINATION=console,file

# Performance
REQUEST_TIMEOUT_MS=30000
MAX_PROMPT_LENGTH=10000
```

### 10.2 Deployment Targets
- **Local Dev**: `npm run dev` (port 3000)
- **Docker**: Containerized Next.js app
- **Vercel**: Native Next.js deployment
- **Self-hosted**: Node.js with PM2/systemd

### 10.3 Scaling Considerations
- Stateless API design (scales horizontally)
- Database abstraction for audit logs (future)
- Redis caching for policy rules (future)
- Load balancing across multiple instances

---

## 11. Integration Points

### 11.1 External Integrations
- **LLM Providers**: OpenAI, Anthropic, local models (via MCP)
- **Logging Backends**: Elasticsearch, Datadog, CloudWatch
- **Identity Providers**: OAuth 2.0, SAML 2.0 (future)
- **Compliance Tools**: Audit log exporters

### 11.2 API Client Libraries
- JavaScript/TypeScript SDK (npm package)
- Python SDK (PyPI)
- REST API documentation (OpenAPI/Swagger)
- GraphQL endpoint (future)

---

## 12. Testing & Quality Assurance

### 12.1 Test Coverage
| Category | Required Coverage | Current |
|----------|---|---|
| Unit Tests | 80% | TBD |
| Integration Tests | 70% | TBD |
| E2E Tests | 60% | TBD |
| Security Tests | 100% | TBD |

### 12.2 Test Scenarios
- **RBAC**: Each role accessing each model
- **Content Policy**: Banned keywords in variations (case, Unicode)
- **Usage Policy**: Role-based model restrictions
- **Audit Logging**: All paths generate logs
- **Error Handling**: Invalid inputs, missing fields
- **Performance**: Response time under load

### 12.3 Security Testing
- Role escalation attempts
- Policy bypass techniques
- Input injection attacks (SQL, prompt injection)
- Authorization boundary testing

---

## 13. Performance & Scalability

### 13.1 Performance Targets
| Metric | Target | Notes |
|--------|--------|-------|
| p50 latency | < 100ms | Policy evaluation + logging |
| p99 latency | < 500ms | Including MCP execution |
| Throughput | 1000 req/s | Per instance |
| Error rate | < 0.1% | Excluding policy denials |

### 13.2 Optimization Strategies
- Policy rule caching (in-memory)
- Async audit logging (non-blocking)
- Connection pooling for backend services
- CDN for static UI assets

---

## 14. Roadmap & Future Enhancements

### Phase 1 (Current - v1.0)
✅ RBAC enforcement  
✅ Content policy (keyword blocking)  
✅ Usage policy (model restrictions)  
✅ Audit logging  
✅ UI playground  

### Phase 2 (v1.1 - Q1 2025)
- [ ] Advanced content filtering (regex, ML-based detection)
- [ ] Rate limiting policies
- [ ] Cost tracking and quotas
- [ ] Custom policy marketplace
- [ ] Webhook notifications for policy violations

### Phase 3 (v1.2 - Q2 2025)
- [ ] OAuth 2.0 / SAML identity integration
- [ ] Multi-tenancy support
- [ ] GraphQL API endpoint
- [ ] Real-time policy decision analytics dashboard
- [ ] Policy versioning and rollback

### Phase 4 (v2.0 - H2 2025)
- [ ] AI-powered anomaly detection
- [ ] Federated learning for policy updates
- [ ] Zero-trust model enforcement
- [ ] Blockchain audit trail (optional)
- [ ] Multi-region deployment support

---

## 15. Success Criteria & KPIs

### 15.1 Adoption Metrics
- Organizations deploying MCP Gateway
- Daily active users
- API request volume growth
- Policy violation detection rate

### 15.2 Quality Metrics
- System uptime (target: 99.9%)
- Average response time
- Policy accuracy (false positive rate)
- Audit log completeness

### 15.3 Security Metrics
- Zero security incidents
- Vulnerability discovery time
- Compliance audit pass rate
- User access review frequency

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| **RBAC** | Role-Based Access Control - authorization based on user roles |
| **MCP** | Model Context Protocol - standard for AI tool interaction |
| **Policy Engine** | System that evaluates and enforces business rules |
| **Audit Log** | Immutable record of all system decisions and events |
| **Subject ID** | Unique identifier for the entity making the request |
| **Policy Decision** | ALLOW/DENY determination based on configured rules |
| **Content Policy** | Rules governing prompt content (e.g., banned keywords) |
| **Usage Policy** | Rules governing model/tool access by role |
| **Gateway** | Entry point that intercepts and authorizes requests |

---

## 17. Appendix: Example Audit Logs

### Example 1: Allowed Request
```json
{
  "timestamp": "2025-01-18T14:32:45.123Z",
  "subjectId": "admin-1",
  "decision": "ALLOW",
  "model": "gpt-4",
  "tool": "code_interpreter",
  "duration_ms": 245
}
```

### Example 2: RBAC Denied
```json
{
  "timestamp": "2025-01-18T14:33:12.456Z",
  "subjectId": "user-5",
  "decision": "DENY",
  "reason": "Access denied",
  "model": "gpt-4",
  "duration_ms": 12
}
```

### Example 3: Content Policy Blocked
```json
{
  "timestamp": "2025-01-18T14:34:01.789Z",
  "subjectId": "user-3",
  "decision": "DENY",
  "reason": "Unsafe content detected",
  "policy": "ContentSafetyPolicy",
  "model": "gpt-3.5",
  "duration_ms": 15
}
```

### Example 4: Usage Policy Blocked
```json
{
  "timestamp": "2025-01-18T14:34:55.234Z",
  "subjectId": "agent-2",
  "decision": "DENY",
  "reason": "Model restricted to admins",
  "policy": "ModelUsagePolicy",
  "model": "gpt-4",
  "duration_ms": 18
}
```

---

**End of Document**  
*For questions or clarifications, contact the Product Team.*
