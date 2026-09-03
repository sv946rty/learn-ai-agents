import { openai } from "@/lib/openai/client";

type PromptRequest = {
    prompt: string;
};

/**
 * Lesson 002-002 — Function/Tool Calling
 *
 * PAST — Section 001 + 002-001
 * --------------------------------
 * Section 001 built our basic LLM application:
 *
 *   Prompt
 *      ↓
 *   Model
 *      ↓
 *   Answer
 *
 * We then added streaming:
 *
 *   Prompt
 *      ↓
 *   Model
 *      ↓
 *   text deltas
 *      ↓
 *   HTTP stream
 *      ↓
 *   Browser UI
 *
 * In 002-001, we introduced the mental model of an agent:
 *
 *   Goal
 *      ↓
 *   Model
 *      ↓
 *   Decision
 *      ↓
 *   Action
 *      ↓
 *   Observation
 *      ↓
 *   Model
 *      ↓
 *   ...
 *      ↓
 *   Final Answer
 *
 * But there was still an important missing piece:
 *
 * How can the model communicate:
 *
 *   "I want the application to perform this action."
 *
 *
 * NOW — 002-002 Function/Tool Calling
 * --------------------------------
 * Function/tool calling gives the model a structured way to REQUEST
 * an action from our application.
 *
 * Instead of only allowing the model to generate text, we describe
 * capabilities that are available to it:
 *
 *   tools: [...]
 *
 * In this lesson, we describe one teaching tool:
 *
 *   get_weather
 *
 * It accepts:
 *
 *   {
 *     location: string
 *   }
 *
 * Important:
 *
 * We are NOT implementing a real weather lookup in this lesson.
 *
 * There is no JavaScript:
 *
 *   function getWeather(...) {
 *       ...
 *   }
 *
 * The tool definition only tells the MODEL that our application
 * claims this capability exists.
 *
 *
 * TOOL DEFINITION
 * --------------------------------
 * Our tool definition looks conceptually like:
 *
 *   {
 *     type: "function",
 *     name: "get_weather",
 *     description: "Get the current weather for a location.",
 *     parameters: {
 *       ...
 *     },
 *     strict: true
 *   }
 *
 * Each part has a purpose.
 *
 * `type`
 *
 *   Identifies this as a function tool.
 *
 * `name`
 *
 *   Gives the tool a stable name that the model can request.
 *
 * `description`
 *
 *   Explains what the capability does so the model can decide
 *   whether it is relevant to the user's request.
 *
 * `parameters`
 *
 *   Describes the structured arguments expected by the tool.
 *
 * For get_weather, the model must provide:
 *
 *   location
 *
 * `strict`
 *
 *   Tells the API that the generated function arguments should
 *   follow the supplied parameter schema strictly.
 *
 *
 * MODEL DECISION
 * --------------------------------
 * Providing a tool does NOT mean the model must always use it.
 *
 * The model can broadly choose between:
 *
 *                         Model
 *                           ↓
 *                        Decision
 *                      ┌────┴────┐
 *                      ↓         ↓
 *               function_call   message
 *                      ↓         ↓
 *              request action   answer directly
 *
 *
 * FUNCTION CALL EXAMPLE
 * --------------------------------
 * We tested:
 *
 *   "What is the weather in San Jose, CA?"
 *
 * The model returned a function call.
 *
 * Our API exposes it as:
 *
 *   {
 *     "type": "function_call",
 *     "name": "get_weather",
 *     "arguments": "{\"location\":\"San Jose, CA\"}",
 *     "callId": "call_..."
 *   }
 *
 * Notice what is NOT present:
 *
 *   temperature
 *   forecast
 *   weather conditions
 *
 * That is because no weather lookup actually happened.
 *
 * The model only requested:
 *
 *   Please call get_weather with:
 *
 *   {
 *     location: "San Jose, CA"
 *   }
 *
 *
 * MESSAGE EXAMPLE
 * --------------------------------
 * We also tested:
 *
 *   "What is 2 + 2? Answer normally without using any tool."
 *
 * The model did not need the weather capability.
 *
 * In one test, our API returned:
 *
 *   {
 *     "type": "message",
 *     "text": "2 + 2 = 4"
 *   }
 *
 * The exact generated text is not part of our API contract.
 * Wording and punctuation can vary between model responses.
 *
 * So merely providing:
 *
 *   tools: [...]
 *
 * does not mean:
 *
 *   always use a tool
 *
 * The model can decide that it can answer directly.
 *
 *
 * REQUEST ≠ EXECUTION
 * --------------------------------
 * This distinction is the most important idea in this lesson.
 *
 * A function_call means:
 *
 *   MODEL REQUESTED AN ACTION
 *
 * It does NOT mean:
 *
 *   APPLICATION EXECUTED THE ACTION
 *
 * The flow currently stops here:
 *
 *   User
 *     ↓
 *   Model
 *     ↓
 *   Decision
 *     ↓
 *   function_call
 *     ↓
 *   STOP
 *
 * We have not yet built the execution side.
 *
 *
 * ARGUMENTS
 * --------------------------------
 * OpenAI returns the function arguments as a JSON string.
 *
 * We observed:
 *
 *   "{\"location\":\"San Jose, CA\"}"
 *
 * Conceptually, that string represents:
 *
 *   {
 *     location: "San Jose, CA"
 *   }
 *
 * Later we could parse it with something such as:
 *
 *   JSON.parse(output.arguments)
 *
 * But we intentionally do NOT do that yet.
 *
 * Parsing and using those arguments becomes meaningful when the
 * application actually executes a tool.
 *
 *
 * CALL ID
 * --------------------------------
 * A function call also contains:
 *
 *   call_id
 *
 * Our public API exposes it as:
 *
 *   callId
 *
 * Example:
 *
 *   "call_2HCc2cli4IU0a3q09OboOygD"
 *
 * Think of this as an identifier for this particular requested
 * function call.
 *
 * Later, when the application produces a result for the requested
 * action, the call ID lets us associate that result with the
 * function call that requested it.
 *
 * We do not use it yet in this lesson.
 *
 *
 * WHY THIS LESSON USES A COMPLETED RESPONSE
 * --------------------------------
 * In 001-005 and 001-006, we already learned streaming.
 *
 * Here we intentionally use a completed Responses API result:
 *
 *   const response = await openai.responses.create(...)
 *
 * without:
 *
 *   stream: true
 *
 * That lets us focus on:
 *
 *   response.output
 *        ↓
 *   function_call OR message
 *
 * without simultaneously introducing streamed tool-call events.
 *
 * Streaming and tool calling are not incompatible.
 *
 * This is simply an intentional curriculum boundary:
 *
 *   first learn streaming
 *        ↓
 *   then learn tool calling
 *        ↓
 *   later combine concepts when appropriate
 *
 *
 * OUR API CONTRACT
 * --------------------------------
 * We do not return the entire raw OpenAI Response object.
 *
 * Instead, our Route Handler translates the model response into
 * one of two simple shapes.
 *
 * Tool request:
 *
 *   {
 *     type: "function_call",
 *     name: "...",
 *     arguments: "...",
 *     callId: "..."
 *   }
 *
 * Normal answer:
 *
 *   {
 *     type: "message",
 *     text: "..."
 *   }
 *
 * Conceptually:
 *
 *                 OpenAI Response
 *                        ↓
 *                 response.output[0]
 *                        ↓
 *                 inspect its type
 *                    ┌────┴────┐
 *                    ↓         ↓
 *             function_call   message
 *                    ↓         ↓
 *              tool request   text answer
 *
 *
 * NEXT — 002-003 Calculator Tool
 * --------------------------------
 * This lesson stops at:
 *
 *   Model
 *      ↓
 *   function_call
 *
 * In 002-003, we will move one step further:
 *
 *   Model
 *      ↓
 *   function_call
 *      ↓
 *   Application reads request
 *      ↓
 *   Application executes real code
 *      ↓
 *   Tool result
 *
 * A calculator is ideal for this because we can clearly distinguish:
 *
 *   model reasoning
 *
 * from:
 *
 *   deterministic application code
 *
 * We still will not build the complete repeating agent loop here.
 *
 * The full:
 *
 *   Model
 *      ↓
 *   Tool Call
 *      ↓
 *   Execute Tool
 *      ↓
 *   Observation
 *      ↓
 *   Model again
 *      ↓
 *   ...
 *
 * belongs to 002-004 — Agent Loop.
 *
 *
 * TEST CASES
 * --------------------------------
 *
 * Prerequisite:
 *
 *   pnpm dev
 *
 *
 * Test 1 — Model requests the available tool:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"What is the weather in San Jose, CA?"}' | jq
 *
 * Expected shape:
 *
 *   {
 *     "type": "function_call",
 *     "name": "get_weather",
 *     "arguments": "{\"location\":\"San Jose, CA\"}",
 *     "callId": "call_..."
 *   }
 *
 * Important:
 *
 * No actual weather lookup occurs.
 *
 *
  * Test 2 — Model answers without using the tool:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"What is 2 + 2? Answer normally without using any tool."}' | jq
 *
 * Expected shape:
 *
 *   {
 *     "type": "message",
 *     "text": "<model-generated answer>"
 *   }
 *
 * For example:
 *
 *   {
 *     "type": "message",
 *     "text": "2 + 2 = 4"
 *   }
 *
 * Exact wording and punctuation can vary between model responses.
 *
 * Test 3 — Another normal message:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Say hello in one short sentence."}' | jq
 *
 * Expected shape:
 *
 *   {
 *     "type": "message",
 *     "text": "<model-generated answer>"
 *   }
 *
 * For example:
 *
 *   {
 *     "type": "message",
 *     "text": "Hello!"
 *   }
 *
 * Exact wording can vary between model responses.
 *
 * Test 4 — Empty prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":""}'
 *
 * Expected:
 *
 *   HTTP 400
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Test 5 — Whitespace-only prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"   "}'
 *
 * Expected:
 *
 *   HTTP 400
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Test 6 — Non-string prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":123}'
 *
 * Expected:
 *
 *   HTTP 400
 *
 *   {"error":"Prompt is required."}
 *
 *
 * At the end of 002-002, our application understands this much:
 *
 *   User Prompt
 *       ↓
 *   OpenAI Responses API
 *       ↓
 *   Model Decision
 *       ↓
 *   ┌──────────────────┐
 *   │                  │
 *   ▼                  ▼
 * function_call      message
 *   │                  │
 *   ▼                  ▼
 * structured          normal
 * tool request        answer
 *
 * The application still does NOT execute the requested tool.
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

    // Give the model a description of the capability our application
    // says is available.
    //
    // This is a TOOL DEFINITION, not a JavaScript implementation of
    // get_weather. The model can request this tool, but nothing in this
    // lesson actually executes a weather lookup.
    const response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
        tools: [
            {
                type: "function",
                name: "get_weather",
                description: "Get the current weather for a location.",
                parameters: {
                    type: "object",
                    properties: {
                        location: {
                            type: "string",
                            description: "The city and state, for example San Jose, CA.",
                        },
                    },
                    required: ["location"],
                    additionalProperties: false,
                },
                strict: true,
            },
        ],
    });

    // Inspect the first output item.
    //
    // For this lesson we care about the distinction between:
    //
    //   function_call → the model is requesting an action
    //   message       → the model answered directly
    //
    // We intentionally do not execute function calls yet.
    const output = response.output[0];

    // A function_call is a structured request from the model.
    //
    // `arguments` is still a JSON string here. We intentionally leave it
    // unparsed because tool execution belongs to 002-003.
    if (output?.type === "function_call") {
        return Response.json({
            type: output.type,
            name: output.name,
            arguments: output.arguments,
            callId: output.call_id,
        });
    }

    // If the model did not request our tool, expose its normal text answer.
    return Response.json({
        type: "message",
        text: response.output_text,
    });
}