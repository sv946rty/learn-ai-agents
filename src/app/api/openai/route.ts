import { openai } from "@/lib/openai/client";

type PromptRequest = {
    prompt: string;
};

/**
 * Lesson 001-003 — Prompt → Response
 *
 * PAST — 001-002 Connect OpenAI
 * --------------------------------
 * We installed the OpenAI SDK, configured OPENAI_API_KEY, created
 * a reusable server-only OpenAI client, and proved that our Next.js
 * server could successfully communicate with OpenAI.
 *
 * The previous route used:
 *
 *   GET /api/openai
 *
 * and sent a hard-coded input:
 *
 *   "Reply with exactly: OpenAI connection successful."
 *
 * That proved the connection worked, but callers could not provide
 * their own prompts yet.
 *
 * NOW — 001-003 Prompt → Response
 * --------------------------------
 * We changed the route from GET to POST so the caller can provide
 * a prompt in the JSON request body.
 *
 * The request body has this shape:
 *
 *   {
 *     "prompt": "Explain what an LLM is in one sentence."
 *   }
 *
 * The route now:
 *
 *   1. Receives the POST request.
 *   2. Reads the JSON request body.
 *   3. Extracts the caller's prompt.
 *   4. Validates that the prompt is a non-empty string.
 *   5. Sends that prompt to OpenAI.
 *   6. Reads response.output_text.
 *   7. Returns the generated response as JSON.
 *
 * This gives us the fundamental LLM interaction:
 *
 *   Prompt → Model → Response
 *
 * The important change from 001-002 is:
 *
 *   BEFORE
 *
 *   route.ts
 *     → hard-coded input
 *     → OpenAI
 *
 *   NOW
 *
 *   caller
 *     → prompt
 *     → route.ts
 *     → OpenAI
 *     → response
 *     → caller
 *
 * NEXT — 001-004 Responses API Deep Dive
 * --------------------------------
 * Once Prompt → Response works, we will examine the Responses API
 * more deeply and understand the response object and related API
 * concepts.
 *
 * Streaming, chat UI, tools, and agents still belong to later
 * lessons.
 *
 * TEST CASES
 * --------------------------------
 *
 * Prerequisite:
 *
 *   pnpm dev
 *
 * Test 1 — Send a simple prompt:
 *
 *   curl -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Explain what an LLM is in one sentence."}'
 *
 * Expected:
 *
 *   JSON containing an answer to the prompt.
 *
 *   Example shape:
 *
 *   {"message":"An LLM is ..."}
 *
 *
 * Test 2 — Send a different prompt:
 *
 *   curl -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"What is 2 + 2?"}'
 *
 * Expected:
 *
 *   JSON containing an answer to the new prompt.
 *
 *   Example shape:
 *
 *   {"message":"4"}
 *
 * The important observation is that changing the request prompt
 * changes what OpenAI is asked to answer. route.ts no longer
 * decides the prompt; the caller does.
 *
 *
 * Test 3 — Reject an empty prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":""}'
 *
 * Expected HTTP status:
 *
 *   400 Bad Request
 *
 * Expected JSON:
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Test 4 — Reject a whitespace-only prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"   "}'
 *
 * Expected HTTP status:
 *
 *   400 Bad Request
 *
 * Expected JSON:
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Test 5 — Reject a non-string prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":123}'
 *
 * Expected HTTP status:
 *
 *   400 Bad Request
 *
 * Expected JSON:
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Together these tests verify:
 *
 *   caller prompt
 *     → POST /api/openai
 *     → request.json()
 *     → runtime validation
 *     → prompt
 *     → OpenAI Responses API
 *     → response.output_text
 *     → JSON returned to the caller
 *
 * They also verify that invalid prompts are rejected before an
 * unnecessary OpenAI API request is made.
 */

export async function POST(request: Request) {
    // Read the JSON body sent by the caller.
    //
    // `PromptRequest` helps TypeScript understand the shape we expect
    // while developing, but a TypeScript type does not validate data
    // arriving over HTTP at runtime.
    const body = (await request.json()) as PromptRequest;

    const prompt = body.prompt;

    // Validate the actual runtime value before calling OpenAI.
    //
    // This rejects:
    //   - missing prompt values
    //   - non-string prompt values
    //   - empty strings
    //   - whitespace-only strings
    if (typeof prompt !== "string" || !prompt.trim()) {
        return Response.json(
            { error: "Prompt is required." },
            { status: 400 },
        );
    }

    // In 001-002, `input` was hard-coded inside route.ts.
    //
    // In 001-003, `input` comes from the caller:
    //
    //   request
    //     → request.json()
    //     → body.prompt
    //     → prompt
    //     → OpenAI
    //
    // This is the key change that gives us Prompt → Response.
    const response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
    });

    // `output_text` gives us the generated text returned by the model.
    //
    // We send that text back to the caller as JSON, completing:
    //
    //   caller prompt
    //     → model
    //     → generated response
    //     → caller
    return Response.json({
        message: response.output_text,
    });
}