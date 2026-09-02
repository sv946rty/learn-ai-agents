import { openai } from "@/lib/openai/client";

/**
 * Lesson 001-002 — Connect OpenAI
 *
 * PAST — 001-001 Project Setup
 * --------------------------------
 * We created the Next.js application and the shared course UI.
 * There was no OpenAI SDK, API key, or model request yet.
 *
 * NOW — 001-002 Connect OpenAI
 * --------------------------------
 * We installed the OpenAI SDK, configured OPENAI_API_KEY in
 * .env.local, and created a reusable server-only OpenAI client.
 *
 * This route makes our first real request to OpenAI.
 *
 * For now, the input is intentionally hard-coded. The goal of this
 * lesson is only to prove that our server can successfully connect
 * to OpenAI and receive a response.
 *
 * NEXT — 001-003 Prompt → Response
 * --------------------------------
 * We will stop using a fixed test message and learn how to send a
 * prompt through our application and return the model's response.
 *
 * Later lessons will add streaming, a chat UI, tools, agent loops,
 * safety guards, RAG, and other agent capabilities.
 *
 * TEST CASES
 * --------------------------------
 *
 * Prerequisite:
 *
 *   pnpm dev
 *
 * Test 1 — Verify the OpenAI connection:
 *
 *   curl http://localhost:3000/api/openai
 *
 * Expected response:
 *
 *   {"message":"OpenAI connection successful."}
 *
 * This verifies the complete path:
 *
 *   curl
 *     → Next.js GET /api/openai
 *     → server-only OpenAI client
 *     → OPENAI_API_KEY
 *     → OpenAI Responses API
 *     → model response
 *     → JSON returned to the caller
 *
 * If this request succeeds, Lesson 001-002 has proven that the
 * application can communicate with OpenAI from the server.
 */

export async function GET() {
    // Send a minimal request through the OpenAI Responses API.
    //
    // The `openai` client is created in src/lib/openai/client.ts.
    // It reads OPENAI_API_KEY from the server environment, so the API
    // key never needs to be sent to the browser.
    const response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: "Reply with exactly: OpenAI connection successful.",
    });

    // `output_text` is the SDK's convenient way to retrieve the
    // combined text output from the model response.
    //
    // In this lesson we simply return that text as JSON so we can
    // verify that the OpenAI connection works end-to-end.
    return Response.json({
        message: response.output_text,
    });
}