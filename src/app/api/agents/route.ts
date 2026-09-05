/**
 * Lesson 002-006 — Safety Guard
 *
 * PAST — 002-005 Multiple Tool Calls
 * --------------------------------
 * In the previous lesson, our agent learned how to handle BOTH dimensions
 * of tool execution:
 *
 *   DEPTH — across model turns
 *
 *       while (true)
 *
 *   BREADTH — multiple tool calls inside one model turn
 *
 *       toolCalls.map(...)
 *
 * The agent could therefore handle:
 *
 *   1. dependent / sequential tool calls across multiple model turns
 *   2. multiple independent tool calls returned in one model response
 *   3. multiple tool types:
 *
 *        calculator
 *        format_number
 *
 * Example of DEPTH:
 *
 *   Model #1
 *       ↓
 *   calculator(27, 43)
 *       ↓
 *   1161
 *       ↓
 *   Model #2
 *       ↓
 *   calculator(1161, 10)
 *       ↓
 *   11610
 *       ↓
 *   Model #3
 *       ↓
 *   format_number(11610)
 *       ↓
 *   "11,610"
 *       ↓
 *   Model #4
 *       ↓
 *   Final Answer
 *
 * Example of BREADTH:
 *
 *                         ┌──→ calculator(27, 43)
 *                         │
 *   Model Response ───────┤
 *                         │
 *                         └──→ calculator(15, 20)
 *
 * The key mental model was:
 *
 *   while = DEPTH
 *   map   = BREADTH
 *
 * But the outer loop still had an important weakness:
 *
 *   while (true)
 *
 * had no application-defined depth limit.
 *
 * We trusted the model/tool cycle to eventually terminate.
 *
 *
 * NOW — 002-006 Safety Guard
 * --------------------------------
 * This lesson adds a safety boundary around AGENT DEPTH.
 *
 * The application now allows at most:
 *
 *   MAX_TOOL_ROUNDS = 5
 *
 * A TOOL ROUND means:
 *
 *   one model response requests one or more tools
 *       ↓
 *   application executes ALL requested tools
 *       ↓
 *   application returns ALL observations to the model
 *
 * One tool round may therefore contain:
 *
 *   ONE tool call
 *
 * or:
 *
 *   MANY tool calls
 *
 * Example:
 *
 *   Model Response
 *       │
 *       ├── calculator(...)
 *       └── calculator(...)
 *              ↓
 *        both tools execute
 *              ↓
 *         toolOutputs[]
 *
 * This is:
 *
 *   1 tool round
 *   2 individual tool calls
 *
 * The safety guard counts TOOL ROUNDS, not individual tool calls.
 *
 *
 * WHY COUNT TOOL ROUNDS?
 * --------------------------------
 * The safety problem introduced in this lesson is unbounded DEPTH:
 *
 *   Model
 *      ↓
 *   Tools
 *      ↓
 *   Model
 *      ↓
 *   Tools
 *      ↓
 *   Model
 *      ↓
 *   Tools
 *      ↓
 *   ...
 *
 * That is controlled by the outer:
 *
 *   while (true)
 *
 * Multiple calls inside one response are a BREADTH problem and are still
 * handled by:
 *
 *   toolCalls.map(...)
 *
 * So our mental model evolves to:
 *
 *   while = DEPTH
 *       ↓
 *   MAX_TOOL_ROUNDS bounds that depth
 *
 *   map = BREADTH
 *       ↓
 *   execute every requested call in this round
 *
 *
 * THREE DIFFERENT COUNTS
 * --------------------------------
 * It is useful to distinguish:
 *
 *   1. MODEL CALLS
 *
 *      Every request made to the model.
 *
 *   2. TOOL ROUNDS
 *
 *      Every model turn where the application executes the requested tools
 *      and sends their observations back.
 *
 *   3. INDIVIDUAL TOOL CALLS
 *
 *      Every actual function execution.
 *
 * Example — no tool needed:
 *
 *   "Say hello."
 *
 *   Model calls:            1
 *   Tool rounds:            0
 *   Individual tool calls:  0
 *
 * Example — one calculator:
 *
 *   Model #1 → calculator(...)
 *   Model #2 → final answer
 *
 *   Model calls:            2
 *   Tool rounds:            1
 *   Individual tool calls:  1
 *
 * Example — two independent calculators in one response:
 *
 *   Model #1
 *       ├── calculator(...)
 *       └── calculator(...)
 *
 *   Model #2 → final answer
 *
 *   Model calls:            2
 *   Tool rounds:            1
 *   Individual tool calls:  2
 *
 *
 * THE SAFETY POLICY
 * --------------------------------
 * We define:
 *
 *   const MAX_TOOL_ROUNDS = 5;
 *   let toolRound = 0;
 *
 * `MAX_TOOL_ROUNDS` is application policy.
 *
 * It says:
 *
 *   "This request may execute at most five tool rounds."
 *
 * `toolRound` is runtime state.
 *
 * It records how many tool rounds this request has already been allowed
 * to execute.
 *
 * Initially:
 *
 *   toolRound = 0
 *
 * Before executing another round:
 *
 *   if (toolRound >= MAX_TOOL_ROUNDS) {
 *       stop
 *   }
 *
 * Otherwise:
 *
 *   toolRound++
 *       ↓
 *   execute every requested tool
 *       ↓
 *   send observations to model
 *
 *
 * WHY CHECK FOR FINAL ANSWER BEFORE THE GUARD?
 * --------------------------------
 * The order is deliberately:
 *
 *   Model Response
 *       ↓
 *   collect toolCalls[]
 *       ↓
 *   toolCalls.length === 0 ?
 *       │
 *       ├── YES → return final answer
 *       │
 *       └── NO
 *            ↓
 *       safety limit reached?
 *            │
 *            ├── YES → 422 safety stop
 *            │
 *            └── NO → execute next tool round
 *
 * This prevents an off-by-one behavior at the boundary.
 *
 * Suppose:
 *
 *   MAX_TOOL_ROUNDS = 5
 *
 * After Round #5:
 *
 *   toolRound = 5
 *
 * The model is still allowed to receive the Round #5 observations and make
 * its next decision.
 *
 * If that next response contains:
 *
 *   NO function_call
 *
 * then the task completed normally:
 *
 *   Round #5
 *       ↓
 *   Model
 *       ↓
 *   Final Answer
 *       ↓
 *   200 OK
 *
 * We do NOT reject that answer merely because:
 *
 *   toolRound === MAX_TOOL_ROUNDS
 *
 * But if the model instead requests another tool:
 *
 *   Round #5
 *       ↓
 *   Model
 *       ↓
 *   requests Round #6
 *       ↓
 *   5 >= 5
 *       ↓
 *   STOP
 *
 * Round #6 is never executed.
 *
 *
 * SAFETY STOP RESPONSE
 * --------------------------------
 * When the model requests another tool round after the allowed maximum,
 * this lesson returns:
 *
 *   HTTP 422
 *
 *   {
 *       "error": "Agent stopped after 5 tool rounds."
 *   }
 *
 * This is an intentional application safety decision rather than an
 * unexpected server crash.
 *
 *
 * EXPERIMENT — REQUESTING A SIXTH ROUND
 * --------------------------------
 * We tested a chain of six dependent calculations:
 *
 *   Round #1
 *       calculator(2, 2)
 *       → 4
 *
 *   Round #2
 *       calculator(4, 2)
 *       → 8
 *
 *   Round #3
 *       calculator(8, 2)
 *       → 16
 *
 *   Round #4
 *       calculator(16, 2)
 *       → 32
 *
 *   Round #5
 *       calculator(32, 2)
 *       → 64
 *
 * The next model response requested:
 *
 *   calculator(64, 2)
 *
 * But there was NO:
 *
 *   TOOL RESULT: calculator 128
 *
 * Instead the application returned:
 *
 *   HTTP 422
 *
 *   {
 *       "error": "Agent stopped after 5 tool rounds."
 *   }
 *
 * This proves that the model may REQUEST Round #6, but the application does
 * not EXECUTE Round #6.
 *
 *
 * EXPERIMENT — EXACTLY FIVE ROUNDS THEN FINISH
 * --------------------------------
 * We also tested exactly five dependent calculations.
 *
 * The execution reached:
 *
 *   Round #5
 *       ↓
 *   calculator(32, 2)
 *       ↓
 *   64
 *
 * The next model response requested no tools and returned:
 *
 *   "64"
 *
 * The Route Handler correctly returned:
 *
 *   HTTP 200
 *
 * This proves the boundary behavior:
 *
 *   5 rounds + FINISH
 *       → allowed
 *
 *   5 rounds + request Round #6
 *       → blocked
 *
 *
 * CURRENT LESSON BOUNDARY
 * --------------------------------
 * 002-006 teaches:
 *
 *   ✓ why an unbounded agent loop needs a safety boundary
 *   ✓ model calls vs tool rounds vs individual tool calls
 *   ✓ tool rounds as the counted unit
 *   ✓ MAX_TOOL_ROUNDS as application policy
 *   ✓ toolRound as per-request runtime state
 *   ✓ checking the guard before executing another round
 *   ✓ allowing normal completion after the final permitted round
 *   ✓ returning a deliberate safety-stop response
 *
 * We preserve everything learned in 002-005:
 *
 *   ✓ calculator
 *   ✓ format_number
 *   ✓ multiple tool types
 *   ✓ dependent tool calls
 *   ✓ independent tool calls
 *   ✓ `.filter()` for all calls in one response
 *   ✓ `.map()` for all calls in one tool round
 *   ✓ call_id correlation
 *   ✓ previous_response_id across model turns
 *
 * We intentionally do NOT add:
 *
 *   ✗ runtime schema validation
 *   ✗ token budgets
 *   ✗ cost budgets
 *   ✗ elapsed-time budgets
 *   ✗ async / concurrent tool execution
 *   ✗ Agent UI
 *
 *
 * NEXT — 002-007 Agent UI
 * --------------------------------
 * The backend agent loop now has:
 *
 *   tool execution
 *       ↓
 *   repeated model decisions
 *       ↓
 *   multiple tool capabilities / calls
 *       ↓
 *   bounded execution depth
 *
 * In 002-007 we will build the user-facing Agent UI.
 *
 * Curriculum progression:
 *
 *   002-003 → execute one real tool
 *   002-004 → agent loop
 *   002-005 → multiple tool capabilities / calls
 *   002-006 → safety guard
 *   002-007 → Agent UI
 *
 *
 * TEST CASES
 * --------------------------------
 * Prerequisite:
 *
 *   pnpm dev
 *
 *
 * Test 1 — Safety guard: request a SIXTH tool round
 * --------------------------------
 * Run:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool for every calculation. Start with 2. Multiply it by 2. Then multiply that result by 2. Then multiply that result by 2. Then multiply that result by 2. Then multiply that result by 2. Then multiply that result by 2. Do each calculation sequentially using the result of the previous calculator call."}'
 *
 * Expected executed rounds:
 *
 *   #1 → 4
 *   #2 → 8
 *   #3 → 16
 *   #4 → 32
 *   #5 → 64
 *
 * The model may then request:
 *
 *   calculator(64, 2)
 *
 * But that call must NOT execute.
 *
 * Expected:
 *
 *   HTTP 422
 *
 *   {"error":"Agent stopped after 5 tool rounds."}
 *
 * During our test, this behavior was confirmed.
 *
 *
 * Test 2 — Boundary: exactly FIVE rounds then finish
 * --------------------------------
 * Run:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool for every calculation. Start with 2. Multiply it by 2. Then multiply that result by 2. Then multiply that result by 2. Then multiply that result by 2. Then multiply that result by 2. Do each calculation sequentially using the result of the previous calculator call. After the fifth calculation, give me the final result."}'
 *
 * Expected:
 *
 *   five tool rounds execute
 *       ↓
 *   model returns final answer
 *       ↓
 *   HTTP 200
 *       ↓
 *   "64"
 *
 * During our test, this behavior was confirmed.
 *
 *
 * Test 3 — Multiple tool TYPES across DEPENDENT rounds
 * --------------------------------
 * Run:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool to multiply 27 by 43. Then multiply that result by 10. Finally, use the format_number tool to format that result."}' | jq
 *
 * Expected application execution:
 *
 *   calculator(27, 43)
 *       ↓
 *   1161
 *       ↓
 *   calculator(1161, 10)
 *       ↓
 *   11610
 *       ↓
 *   format_number(11610)
 *       ↓
 *   "11,610"
 *       ↓
 *   Final Answer
 *
 * Expected semantic result:
 *
 *   11,610
 *
 *
 * Test 4 — Multiple INDEPENDENT calls in ONE tool round
 * --------------------------------
 * Run:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool to do two independent calculations: (1) multiply 27 by 43, and (2) multiply 15 by 20. Give me both results."}' | jq
 *
 * Expected semantic results:
 *
 *   27 × 43 = 1161
 *   15 × 20 = 300
 *
 * If both calls appear in the same model response:
 *
 *   Tool rounds:            1
 *   Individual tool calls:  2
 *
 *
 * Test 5 — No tool required
 * --------------------------------
 * Run:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Say hello in one short sentence."}' | jq
 *
 * Expected:
 *
 *   TOOL CALLS: []
 *
 *   Model calls:            1
 *   Tool rounds:            0
 *   Individual tool calls:  0
 *
 *
 * Test 6 — ONE calculator call
 * --------------------------------
 * Run:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool to multiply 27 by 43."}' | jq
 *
 * Expected semantic result:
 *
 *   1161
 *
 *
 * Test 7 — Empty prompt
 * --------------------------------
 * Run:
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
 * Test 8 — Whitespace-only prompt
 * --------------------------------
 * Run:
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
 * Test 9 — Non-string prompt
 * --------------------------------
 * Run:
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
 * FINAL VERIFICATION
 * --------------------------------
 * After the lesson UI and supporting materials are complete:
 *
 *   pnpm lint
 *   pnpm build
 *
 *
 * 002-006 TEST MATRIX
 * --------------------------------
 *
 *   ✓ request Round #6 → blocked with 422
 *   ✓ Round #6 tool implementation does NOT execute
 *   ✓ exactly 5 rounds + final answer → 200
 *   ✓ dependent calls under the limit
 *   ✓ multiple independent calls in one round
 *   ✓ multiple tool-name dispatch
 *   ✓ zero function calls
 *   ✓ one function call
 *   ✓ multiple function calls
 *   ✓ empty-prompt validation
 *   ✓ whitespace-only validation
 *   ✓ non-string validation
 *
 *
 * At the end of 002-006:
 *
 *                    ┌──────────────────────────────┐
 *                    │ MAX_TOOL_ROUNDS = 5          │
 *                    │ toolRound = 0                │
 *                    └──────────────┬───────────────┘
 *                                   ↓
 *                               Model
 *                                   ↓
 *                             toolCalls[]
 *                                   │
 *                      ┌────────────┴────────────┐
 *                      │                         │
 *                 no tool calls             tool calls
 *                      │                         │
 *                      ↓                         ↓
 *                Final Answer              guard check
 *                                               │
 *                                  ┌────────────┴────────────┐
 *                                  │                         │
 *                              limit hit                 allowed
 *                                  │                         │
 *                                  ↓                         ↓
 *                              422 STOP                toolRound++
 *                                                            ↓
 *                                                     toolCalls.map(...)
 *                                                            ↓
 *                                                       toolOutputs[]
 *                                                            ↓
 *                                                       Model again
 *
 * The agent can still reason and use tools repeatedly.
 *
 * The application now decides how deep that repeated execution is allowed
 * to go.
 */

import { openai } from "@/lib/openai/client";

import {
    calculator,
    type CalculatorOperation,
} from "@/lib/agents/calculator";

import { formatNumber } from "@/lib/agents/format-number";

type PromptRequest = {
    prompt: string;
};

const calculatorTool = {
    type: "function" as const,
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
};

const formatNumberTool = {
    type: "function" as const,
    name: "format_number",
    description: "Format a number using US thousands separators.",
    parameters: {
        type: "object",
        properties: {
            value: {
                type: "number",
                description: "The number to format.",
            },
        },
        required: ["value"],
        additionalProperties: false,
    },
    strict: true,
};

export async function POST(request: Request) {
    // Read the JSON body sent by the caller.
    //
    // `PromptRequest` describes the shape TypeScript expects while we
    // develop, but it does not validate incoming HTTP data at runtime.
    const body = (await request.json()) as PromptRequest;

    const prompt = body.prompt;

    // Keep the runtime prompt validation introduced in 001-003.
    //
    // Invalid prompts are rejected before an unnecessary OpenAI API
    // request is made.
    if (typeof prompt !== "string" || !prompt.trim()) {
        return Response.json(
            { error: "Prompt is required." },
            { status: 400 },
        );
    }

    // Start the first model turn.
    //
    // The model still has the two capabilities introduced in 002-005:
    //
    //   calculator
    //   format_number
    //
    // The safety guard added in this lesson does not change tool
    // definitions or tool implementations. It bounds how many rounds of
    // tool execution the outer agent loop may perform.
    let response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
        tools: [calculatorTool, formatNumberTool],
    });

    // 002-006 SAFETY POLICY
    //
    // One counted unit is ONE TOOL ROUND:
    //
    //   model requests one or more tools
    //       ↓
    //   application executes all requested tools
    //       ↓
    //   application sends all observations back
    //
    // We deliberately count rounds rather than individual tool calls because
    // this lesson is bounding DEPTH, not BREADTH.
    const MAX_TOOL_ROUNDS = 5;
    let toolRound = 0;

    // Keep asking the model what to do until:
    //
    //   A. it stops requesting tools and returns a final answer
    //
    // or:
    //
    //   B. it attempts to exceed MAX_TOOL_ROUNDS
    //
    // `while (true)` still provides agent DEPTH. The new safety guard bounds
    // that depth.
    while (true) {
        // One model response may contain zero, one, or many function calls.
        //
        // `.filter()` collects ALL calls requested in this model turn.
        const toolCalls = response.output.filter(
            (item) => item.type === "function_call",
        );

        // Temporary teaching instrumentation.
        //
        // This lets us observe the difference between a requested tool round
        // and a tool round that the application actually permits to execute.
        console.log("TOOL CALLS:", toolCalls);

        // IMPORTANT ORDERING:
        //
        // Check for normal completion BEFORE checking the safety limit.
        //
        // This allows Round #5 to execute and then lets the model return a
        // normal final answer. Reaching the limit does not itself mean
        // failure; REQUESTING another tool round after the limit does.
        if (toolCalls.length === 0) {
            return Response.json({
                type: "message",
                text: response.output_text,
                output: response.output,
            });
        }

        // SAFETY GUARD
        //
        // `toolRound` means:
        //
        //   number of tool rounds already allowed to execute
        //
        // If five rounds have already executed, another requested round would
        // be Round #6, so stop BEFORE executing any of its tools.
        if (toolRound >= MAX_TOOL_ROUNDS) {
            return Response.json(
                {
                    error: `Agent stopped after ${MAX_TOOL_ROUNDS} tool rounds.`,
                },
                { status: 422 },
            );
        }

        // This requested tool round has passed the safety check.
        //
        // Count the round once, regardless of whether this response contains
        // one tool call or several tool calls.
        toolRound++;

        // Execute EVERY function call requested in this permitted tool round.
        //
        // `.map()` continues to handle BREADTH:
        //
        //   toolCalls[]
        //       ↓
        //   execute every requested tool
        //       ↓
        //   toolOutputs[]
        //
        // The safety guard does not change this 002-005 behavior.
        const toolOutputs = toolCalls.map((toolCall) => {
            let result: number | string;

            // Dispatch by the MODEL-FACING tool name.
            //
            // The model chooses WHAT capability it wants.
            // The application decides HOW that capability is implemented.
            if (toolCall.name === "calculator") {
                const arguments_ = JSON.parse(toolCall.arguments) as {
                    operation: CalculatorOperation;
                    a: number;
                    b: number;
                };

                result = calculator(
                    arguments_.operation,
                    arguments_.a,
                    arguments_.b,
                );
            } else if (toolCall.name === "format_number") {
                const arguments_ = JSON.parse(toolCall.arguments) as {
                    value: number;
                };

                result = formatNumber(arguments_.value);
            } else {
                // This branch should not be reached with the currently
                // advertised tool definitions.
                //
                // Fail explicitly rather than silently executing the wrong
                // application function.
                throw new Error(`Unknown tool: ${toolCall.name}`);
            }

            // Temporary teaching instrumentation.
            //
            // If a sixth round is blocked, its TOOL CALLS log may appear,
            // but there must be no corresponding TOOL RESULT because the
            // guard runs before this `.map()`.
            console.log("TOOL RESULT:", toolCall.name, result);

            // Preserve the exact relationship between each requested
            // function call and its observation:
            //
            //   call_A → output_A
            //   call_B → output_B
            return {
                type: "function_call_output" as const,
                call_id: toolCall.call_id,
                output: String(result),
            };
        });

        // Send ALL observations from this permitted tool round back together.
        //
        // `previous_response_id` continues the same Responses API chain so
        // the model can observe the tool results and decide what to do next.
        response = await openai.responses.create({
            model: "gpt-5.6-luna",
            previous_response_id: response.id,
            input: toolOutputs,
            tools: [calculatorTool, formatNumberTool],
        });
    }
}