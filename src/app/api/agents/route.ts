import { openai } from "@/lib/openai/client";

import {
    calculator,
    type CalculatorOperation,
} from "@/lib/agents/calculator";

type PromptRequest = {
    prompt: string;
};

/**
 * Lesson 002-003 — Calculator Tool
 *
 * PAST — 002-002 Function/Tool Calling
 * --------------------------------
 * In the previous lesson, the model could REQUEST a structured action:
 *
 *   User → Model → function_call → STOP
 *
 * We demonstrated that boundary with a declared `get_weather` tool.
 * There was no real weather implementation behind it.
 *
 * A function_call meant:
 *
 *   MODEL REQUESTED AN ACTION
 *
 * It did NOT mean:
 *
 *   APPLICATION EXECUTED THE ACTION
 *
 *
 * NOW — 002-003 Calculator Tool
 * --------------------------------
 * This lesson adds the missing execution side.
 *
 * We replace the teaching-only weather capability with a real,
 * deterministic calculator:
 *
 *   User Prompt
 *       ↓
 *   Model
 *       ↓
 *   function_call: calculator
 *       ↓
 *   JSON.parse(output.arguments)
 *       ↓
 *   calculator(...)
 *       ↓
 *   deterministic result
 *       ↓
 *   STOP
 *
 * Example:
 *
 *   "Use the calculator tool to multiply 27 by 43."
 *
 * The model can request:
 *
 *   {
 *     operation: "multiply",
 *     a: 27,
 *     b: 43
 *   }
 *
 * Our application then executes:
 *
 *   calculator("multiply", 27, 43)
 *
 * and JavaScript produces:
 *
 *   1161
 *
 *
 * TOOL DEFINITION ≠ TOOL IMPLEMENTATION
 * --------------------------------
 * There are two separate pieces.
 *
 * Model-facing definition:
 *
 *   name: "calculator"
 *   operation
 *   a
 *   b
 *
 * Application-side implementation:
 *
 *   src/lib/agents/calculator.ts
 *
 *   calculator(operation, a, b)
 *
 * The string `name: "calculator"` does NOT automatically execute the
 * TypeScript function. Our Route Handler explicitly makes that connection.
 *
 *
 * MODEL DECISION VS APPLICATION EXECUTION
 * --------------------------------
 * The model decides WHAT action to request.
 *
 * The application decides HOW that action is implemented and executes it.
 *
 *                         Model
 *                           ↓
 *                        Decision
 *                      ┌────┴────┐
 *                      ↓         ↓
 *               function_call   message
 *                      ↓         ↓
 *                parse args     answer
 *                      ↓        directly
 *                calculator()
 *                      ↓
 *                   result
 *
 * Providing a calculator still does NOT force the model to use it.
 *
 *
 * ARGUMENTS
 * --------------------------------
 * OpenAI returns function-call arguments as a JSON string.
 *
 * Conceptually:
 *
 *   "{\"operation\":\"multiply\",\"a\":27,\"b\":43}"
 *
 * In 002-002 we deliberately left that string unparsed.
 *
 * In 002-003 we do:
 *
 *   JSON.parse(output.arguments)
 *
 * producing a JavaScript object:
 *
 *   {
 *     operation: "multiply",
 *     a: 27,
 *     b: 43
 *   }
 *
 *
 * EXECUTION
 * --------------------------------
 * This is the conceptual milestone of 002-003:
 *
 *   const result = calculator(
 *     arguments_.operation,
 *     arguments_.a,
 *     arguments_.b,
 *   );
 *
 * OpenAI does not execute our TypeScript calculator for us.
 * Our application executes it.
 *
 * The calculator supports:
 *
 *   add
 *   subtract
 *   multiply
 *   divide
 *
 *
 * CURRENT API CONTRACT
 * --------------------------------
 * Tool execution:
 *
 *   {
 *     "type": "function_call",
 *     "name": "calculator",
 *     "arguments": {
 *       "operation": "multiply",
 *       "a": 27,
 *       "b": 43
 *     },
 *     "result": 1161,
 *     "callId": "call_..."
 *   }
 *
 * `result` is produced by OUR application.
 *
 * Normal model answer:
 *
 *   {
 *     "type": "message",
 *     "text": "..."
 *   }
 *
 *
 * CALL ID
 * --------------------------------
 * OpenAI gives each requested function call a `call_id`.
 *
 * We expose it as `callId`.
 *
 * We still do not send the calculator result back to the model in this
 * lesson. The call ID becomes more important when we do that next.
 *
 *
 * WHY THIS LESSON STILL USES A COMPLETED RESPONSE
 * --------------------------------
 * Section 001 already taught token streaming.
 *
 * Here we intentionally keep the Responses API call non-streamed so the
 * lesson can focus on:
 *
 *   function_call
 *       ↓
 *   parse arguments
 *       ↓
 *   execute application code
 *       ↓
 *   result
 *
 * Streaming and tool calling are not incompatible. This is an intentional
 * curriculum boundary.
 *
 *
 * IMPORTANT — THIS IS NOT THE AGENT LOOP YET
 * --------------------------------
 * Our current flow ends after tool execution:
 *
 *   Model
 *      ↓
 *   function_call
 *      ↓
 *   calculator(...)
 *      ↓
 *   result
 *      ↓
 *   STOP
 *
 * We do NOT yet do:
 *
 *   result
 *      ↓
 *   send observation back to model
 *      ↓
 *   model decides again
 *
 *
 * NEXT — 002-004 Agent Loop
 * --------------------------------
 * The next lesson returns the calculator result to the model as an
 * observation so the model can decide what to do next.
 *
 * Teaching prompt:
 *
 *   "Multiply 27 by 43. Then multiply that result by 10."
 *
 * Conceptually:
 *
 *   Model
 *      ↓
 *   calculator(27 × 43)
 *      ↓
 *   1161
 *      ↓
 *   Model again
 *      ↓
 *   calculator(1161 × 10)
 *      ↓
 *   11610
 *      ↓
 *   Model again
 *      ↓
 *   Final Answer
 *
 * We intentionally do NOT implement that loop in 002-003.
 *
 *
 * LATER — 002-005 Multiple Tool Calls
 * --------------------------------
 * After the loop is understood with one calculator capability, we can
 * give the model multiple different tools:
 *
 *   calculator(...)
 *       ↓
 *   calculator(...)
 *       ↓
 *   formatNumber(...)
 *       ↓
 *   Final Answer
 *
 * Curriculum boundary:
 *
 *   002-003 → execute one real tool
 *   002-004 → repeat model/tool/observation decisions
 *   002-005 → choose among multiple tool capabilities
 *
 *
 * TEST CASES
 * --------------------------------
 *
 * Prerequisite:
 *
 *   pnpm dev
 *
 * Test 1 — Multiply 27 by 43:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool to multiply 27 by 43."}' | jq
 *
 * Expected important fields:
 *
 *   {
 *     "type": "function_call",
 *     "name": "calculator",
 *     "arguments": {
 *       "operation": "multiply",
 *       "a": 27,
 *       "b": 43
 *     },
 *     "result": 1161,
 *     "callId": "call_..."
 *   }
 *
 * Test 2 — Add:
 *
 *   "Use the calculator tool to add 20 and 5."
 *
 * Expected result: 25
 *
 * Test 3 — Subtract:
 *
 *   "Use the calculator tool to subtract 8 from 20."
 *
 * Expected result: 12
 *
 * Test 4 — Multiply:
 *
 *   "Use the calculator tool to multiply 6 by 7."
 *
 * Expected result: 42
 *
 * Test 5 — Divide:
 *
 *   "Use the calculator tool to divide 20 by 4."
 *
 * Expected result: 5
 *
 * Test 6 — Model answers without using the tool:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Say hello in one word. Do not use any tool."}' | jq
 *
 * Expected shape:
 *
 *   {
 *     "type": "message",
 *     "text": "<model-generated answer>"
 *   }
 *
 * Exact wording can vary.
 *
 * Test 7 — Empty prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":""}'
 *
 * Expected: HTTP 400
 *
 *   {"error":"Prompt is required."}
 *
 * Test 8 — Whitespace-only prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"   "}'
 *
 * Expected: HTTP 400
 *
 * Test 9 — Non-string prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":123}'
 *
 * Expected: HTTP 400
 *
 *
 * At the end of 002-003:
 *
 *   User Prompt
 *       ↓
 *   Model
 *       ↓
 *   Decision
 *      ┌┴───────────────┐
 *      ↓                ↓
 * function_call       message
 *      ↓                ↓
 * parse arguments     normal answer
 *      ↓
 * calculator(...)
 *      ↓
 * real result
 *      ↓
 *     STOP
 *
 * The missing step is now:
 *
 *   How does the MODEL receive the result and decide again?
 *
 * That is 002-004 — Agent Loop.
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

    // Describe the calculator capability to the model.
    //
    // This TOOL DEFINITION tells the model how to REQUEST the calculator.
    // It is separate from the real TypeScript `calculator()` implementation
    // imported above. Our application explicitly connects the two.
    const response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
        tools: [
            {
                type: "function",
                name: "calculator",
                description: "Perform basic arithmetic using two numbers.",
                parameters: {
                    type: "object",
                    properties: {
                        operation: {
                            type: "string",
                            enum: ["add", "subtract", "multiply", "divide"],
                        },
                        a: {
                            type: "number",
                        },
                        b: {
                            type: "number",
                        },
                    },
                    required: ["operation", "a", "b"],
                    additionalProperties: false,
                },
                strict: true,
            },
        ],
    });

    // Inspect the first output item.
    //
    // The model can still choose between:
    //
    //   function_call → request the calculator
    //   message       → answer directly
    //
    // New in 002-003: when the model requests our calculator, the
    // application parses the arguments and executes real TypeScript.
    const output = response.output[0];

    // A function_call is a structured request from the model.
    //
    // OpenAI returns `arguments` as a JSON string. Tool execution requires
    // application data, so this lesson parses that string into an object.
    if (output?.type === "function_call") {
        const arguments_ = JSON.parse(output.arguments) as {
            operation: CalculatorOperation;
            a: number;
            b: number;
        };

        // This is the key new step in 002-003:
        //
        // The model REQUESTED the action, but our APPLICATION executes it.
        // There is no automatic connection between the tool name
        // "calculator" and this JavaScript function call.
        const result = calculator(
            arguments_.operation,
            arguments_.a,
            arguments_.b,
        );

        return Response.json({
            type: output.type,
            name: output.name,
            arguments: arguments_,
            result,
            callId: output.call_id,
        });
    }

    // If the model did not request our tool, expose its normal text answer.
    return Response.json({
        type: "message",
        text: response.output_text,
    });
}