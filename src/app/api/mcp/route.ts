import { NextRequest, NextResponse } from "next/server";
import { MCPRequestSchema } from "@/types";
import { orchestrateRequest, OrchestrationResult } from "@/core/orchestrator";
import { PolicyEngine, createDefaultPolicyEngine } from "@/core/policyEngine";
import { ContentPolicy } from "@/policy/rules/content";
import { UsagePolicy } from "@/policy/rules/usage";
import { executeWithGroq } from "@/core/executor";

/**
 * POST /api/mcp
 *
 * Main HTTP endpoint for MCP protocol
 *
 * Request Flow:
 * 1. Validate input with Zod schema
 * 2. Orchestrate through auth pipeline (RBAC → Policies)
 * 3. If approved: Execute with Groq
 * 4. Return response with audit trail
 *
 * Request Body:
 * {
 *   identity: { subjectId: string, role: "admin" | "agent" | "user" },
 *   prompt: string,
 *   model: string,
 *   tool?: string,
 *   timestamp: number
 * }
 */

// Lazy-load policy engine to avoid build-time errors
let policyEngine: PolicyEngine | null = null;

function getPolicyEngine(): PolicyEngine {
  if (!policyEngine) {
    policyEngine = createDefaultPolicyEngine(
      new ContentPolicy(),
      new UsagePolicy()
    );
  }
  return policyEngine;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Step 1: Parse and validate request body
    const body = await req.json();
    console.log("[API] Received request:", {
      subjectId: body.identity?.subjectId,
      role: body.identity?.role,
      model: body.model,
      promptLength: body.prompt?.length,
    });

    const request = MCPRequestSchema.parse({
      ...body,
      timestamp: Date.now(),
    });

    // Step 2: Orchestrate through authorization pipeline
    const policyEngine = getPolicyEngine();
    const orchestrationResult = await orchestrateRequest(request, policyEngine);

    // Step 3: If denied by auth gates, return immediately with 403
    if (!orchestrationResult.allowed) {
      console.log("[API] Request denied at gate:", orchestrationResult.policy);
      return NextResponse.json(
        {
          success: false,
          error: "Request denied",
          reason: orchestrationResult.reason,
          policy: orchestrationResult.policy,
          evaluationChain: orchestrationResult.evaluationChain,
        },
        { status: 403 }
      );
    }

    // Step 4: Execute with Groq (since all gates passed)
    console.log("[API] Executing with Groq:", request.model);
    const executionResult = await executeWithGroq(request);

    if (executionResult.error) {
      console.error("[API] Execution error:", executionResult.error);
      return NextResponse.json(
        {
          success: false,
          error: "Execution failed",
          message: executionResult.error,
        },
        { status: 500 }
      );
    }

    // Step 5: Return success response with execution details
    const finalResponse = {
      success: true,
      data: {
        response: executionResult.content,
        metadata: {
          model: executionResult.model,
          toolsUsed: executionResult.toolsUsed || [],
          tokensUsed: executionResult.tokensUsed || { input: 0, output: 0 },
          durationMs: Date.now() - startTime,
          subjectId: orchestrationResult.subjectId,
          evaluationChain: orchestrationResult.evaluationChain,
        },
      },
    };

    console.log("[API] Request successful, duration:", Date.now() - startTime + "ms");
    return NextResponse.json(finalResponse, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[API] Error during request:", {
      error:
        error instanceof Error ? error.message : "Unknown error",
      duration,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    // Handle validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: (error as any).errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

