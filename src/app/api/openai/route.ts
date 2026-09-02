import { openai } from "@/lib/openai/client";

type PromptRequest = {
    prompt: string;
};

/**
 * Lesson 001-004 — Responses API Deep Dive
 *
 * PAST — 001-003 Prompt → Response
 * --------------------------------
 * We changed /api/openai from a fixed GET connectivity test into
 * a POST endpoint that accepts a caller-provided prompt.
 *
 * The request flow became:
 *
 *   caller
 *     → POST /api/openai
 *     → request.json()
 *     → prompt validation
 *     → OpenAI
 *     → response.output_text
 *     → JSON response
 *
 * In 001-003, however, we extracted only:
 *
 *   response.output_text
 *
 * and returned:
 *
 *   {
 *     "message": "..."
 *   }
 *
 * That was enough to build Prompt → Model → Response, but OpenAI
 * actually returned a much richer Response object.
 *
 * NOW — 001-004 Responses API Deep Dive
 * --------------------------------
 * We will look more closely at the Response object returned by:
 *
 *   openai.responses.create(...)
 *
 * Instead of returning only response.output_text, this lesson
 * exposes a small, useful subset of the Response:
 *
 *   response
 *     ├── id
 *     ├── status
 *     ├── model
 *     ├── output
 *     ├── output_text
 *     └── usage
 *
 * These fields help us understand several important concepts:
 *
 *   id
 *     → identifies this particular OpenAI Response
 *
 *   status
 *     → tells us the state of the Response
 *
 *   model
 *     → identifies the model associated with the Response
 *
 *   output
 *     → contains the structured output items produced by the model
 *
 *   output_text
 *     → provides convenient access to the combined generated text
 *
 *   usage
 *     → reports token usage for the request and response
 *
 * For a simple text response, `output` may look conceptually like:
 *
 *   output[]
 *     └── message
 *         ├── role: "assistant"
 *         └── content[]
 *             └── output_text
 *                 └── text: "2 + 2 = 4"
 *
 * while:
 *
 *   response.output_text
 *
 * gives us the convenient text representation:
 *
 *   "2 + 2 = 4"
 *
 * This gives us two useful views of model output:
 *
 *   response.output
 *     → structured representation
 *
 *   response.output_text
 *     → convenient text representation
 *
 * We also expose `usage` so we can observe:
 *
 *   input_tokens
 *   output_tokens
 *   total_tokens
 *
 * NEXT — 001-005 Streaming
 * --------------------------------
 * So far, our application waits for the model to finish generating
 * the complete response before returning it to the caller.
 *
 * In the next lesson, we will begin streaming output so generated
 * content can arrive progressively instead of waiting for the full
 * response.
 *
 * Chat UI, tools, agent loops, RAG, LangGraph, MCP, and evaluation
 * still belong to later lessons.
 *
 * TEST CASES
 * --------------------------------
 *
 * Prerequisite:
 *
 *   pnpm dev
 *
 * Test 1 — Inspect a successful Response:
 *
 *   curl -s -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"What is 2 + 2?"}' \
 *     | python3 -m json.tool
 *
 * Expected shape:
 *
 *   {
 *     "id": "resp_...",
 *     "status": "completed",
 *     "model": "gpt-5.6-luna",
 *     "output": [...],
 *     "outputText": "2 + 2 = 4",
 *     "usage": {
 *       "input_tokens": ...,
 *       "output_tokens": ...,
 *       "total_tokens": ...
 *     }
 *   }
 *
 * The exact response ID and token counts may differ between
 * requests.
 *
 *
 * Test 2 — Compare structured output with outputText:
 *
 * Run the same request and inspect:
 *
 *   output
 *
 * versus:
 *
 *   outputText
 *
 * `output` contains structured output items.
 *
 * For our simple text request, the generated text can be found
 * inside a message content item:
 *
 *   output[]
 *     → message
 *     → content[]
 *     → output_text
 *     → text
 *
 * `outputText` comes from:
 *
 *   response.output_text
 *
 * and gives us convenient access to the generated text without
 * manually walking through the structured output items.
 *
 *
 * Test 3 — Inspect token usage:
 *
 * In the same JSON response, inspect:
 *
 *   usage.input_tokens
 *   usage.output_tokens
 *   usage.total_tokens
 *
 * For the request:
 *
 *   "What is 2 + 2?"
 *
 * one observed response reported:
 *
 *   input_tokens: 14
 *   output_tokens: 11
 *   total_tokens: 25
 *
 * Exact token usage may vary. The important concept is:
 *
 *   input tokens
 *     + output tokens
 *     = total tokens
 *
 *
 * Test 4 — Invalid prompts are still rejected:
 *
 *   curl -i -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":""}'
 *
 * Expected:
 *
 *   HTTP 400 Bad Request
 *
 *   {"error":"Prompt is required."}
 *
 * This confirms that the runtime validation introduced in 001-003
 * still protects the OpenAI request.
 *
 *
 * Together these tests demonstrate:
 *
 *   caller prompt
 *       ↓
 *   POST /api/openai
 *       ↓
 *   runtime validation
 *       ↓
 *   openai.responses.create()
 *       ↓
 *   OpenAI Response object
 *       │
 *       ├── id
 *       ├── status
 *       ├── model
 *       ├── output
 *       ├── output_text
 *       └── usage
 *       ↓
 *   selected Response data returned as JSON
 */

export async function POST(request: Request) {
    // Read the JSON body sent by the caller.
    //
    // `PromptRequest` describes the shape TypeScript expects while we
    // develop, but it does not validate incoming HTTP data at runtime.
    const body = (await request.json()) as PromptRequest;

    const prompt = body.prompt;

    // Keep the runtime validation introduced in 001-003.
    //
    // Invalid prompts are rejected before an unnecessary OpenAI API
    // request is made.
    if (typeof prompt !== "string" || !prompt.trim()) {
        return Response.json(
            { error: "Prompt is required." },
            { status: 400 },
        );
    }

    // Send the caller's prompt through the OpenAI Responses API.
    //
    // `await` gives us the completed Response object returned by
    // openai.responses.create().
    const response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
    });

    // In 001-003, we returned only:
    //
    //   response.output_text
    //
    // In 001-004, we intentionally expose several selected fields so
    // we can study the structure of the Responses API without dumping
    // every property returned by OpenAI.
    return Response.json({
        // Unique identifier for this OpenAI Response.
        id: response.id,

        // State of the OpenAI Response, such as "completed".
        //
        // This is different from the HTTP status code returned by our
        // Next.js endpoint.
        status: response.status,

        // Model associated with this Response.
        model: response.model,

        // Structured output items returned by the model.
        //
        // For a simple text request, this commonly contains a message
        // whose content includes an output_text item.
        output: response.output,

        // Convenient combined text representation provided by the SDK.
        //
        // This saves us from manually walking through `output` when all
        // we need is the generated text.
        outputText: response.output_text,

        // Token usage information for this request and response.
        usage: response.usage,
    });
}