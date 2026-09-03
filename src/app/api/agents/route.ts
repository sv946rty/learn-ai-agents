import { openai } from "@/lib/openai/client";

import {
    calculator,
    type CalculatorOperation,
} from "@/lib/agents/calculator";

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

/**
 * Lesson 002-004 — Agent Loop
 *
 * PAST — 002-003 Calculator Tool
 * --------------------------------
 * In the previous lesson, the model could request a calculator action and
 * our application could execute it:
 *
 *   User Prompt
 *       ↓
 *   Model
 *       ↓
 *   function_call
 *       ↓
 *   calculator(...)
 *       ↓
 *   result
 *       ↓
 *   STOP
 *
 * Example:
 *
 *   "Use the calculator tool to multiply 27 by 43."
 *
 * The model could request:
 *
 *   calculator("multiply", 27, 43)
 *
 * Our application executed the calculator and produced:
 *
 *   1161
 *
 * But that result was returned to the HTTP caller.
 *
 * The MODEL never received 1161.
 *
 * Because of that, a multi-step goal such as:
 *
 *   "Multiply 27 by 43. Then multiply that result by 10."
 *
 * could not continue after the first calculator execution.
 *
 *
 * NOW — 002-004 Agent Loop
 * --------------------------------
 * This lesson adds the missing feedback loop.
 *
 * Instead of stopping after the application executes a tool, we send the
 * tool result back to the model as an observation.
 *
 * The model can then decide what to do next.
 *
 *   User Prompt
 *       ↓
 *   Model
 *       ↓
 *   function_call
 *       ↓
 *   calculator(...)
 *       ↓
 *   result
 *       ↓
 *   function_call_output
 *       ↓
 *   Model again
 *       ↓
 *      ...
 *       ↓
 *   Final Answer
 *
 * The application keeps repeating this process until the model stops
 * requesting a function call.
 *
 *
 * THE AGENT LOOP
 * --------------------------------
 * The central idea in this lesson is:
 *
 *   while (true) {
 *       ask model what to do
 *
 *       if model does not request a tool {
 *           return final answer
 *       }
 *
 *       execute requested tool
 *       send tool result back to model
 *   }
 *
 * The application does NOT know ahead of time how many model/tool cycles
 * a task will require.
 *
 * A simple question might require:
 *
 *   Model
 *      ↓
 *   Final Answer
 *
 * A one-step tool task might require:
 *
 *   Model
 *      ↓
 *   Tool
 *      ↓
 *   Model
 *      ↓
 *   Final Answer
 *
 * A multi-step task might require:
 *
 *   Model
 *      ↓
 *   Tool
 *      ↓
 *   Model
 *      ↓
 *   Tool
 *      ↓
 *   Model
 *      ↓
 *   Final Answer
 *
 *
 * TEACHING EXAMPLE
 * --------------------------------
 * Prompt:
 *
 *   "Use the calculator tool to multiply 27 by 43.
 *    Then multiply that result by 10."
 *
 * Conceptually:
 *
 *   Model #1
 *      ↓
 *   function_call
 *   calculator(27, 43)
 *      ↓
 *   Application executes
 *      ↓
 *   1161
 *      ↓
 *   function_call_output("1161")
 *      ↓
 *   Model #2
 *      ↓
 *   function_call
 *   calculator(1161, 10)
 *      ↓
 *   Application executes
 *      ↓
 *   11610
 *      ↓
 *   function_call_output("11610")
 *      ↓
 *   Model #3
 *      ↓
 *   no function_call
 *      ↓
 *   Final Answer
 *
 * In our test, the model presented the final answer as:
 *
 *   "11,610"
 *
 * The calculator itself produced the numeric value:
 *
 *   11610
 *
 * The model chose how to present that value in its final natural-language
 * response.
 *
 *
 * FUNCTION_CALL_OUTPUT
 * --------------------------------
 * After executing the calculator, the application creates an observation:
 *
 *   const toolOutput = {
 *       type: "function_call_output",
 *       call_id: toolCall.call_id,
 *       output: String(result),
 *   };
 *
 * Example:
 *
 *   {
 *       type: "function_call_output",
 *       call_id: "call_abc123",
 *       output: "1161"
 *   }
 *
 * This is different from 002-003.
 *
 * In 002-003:
 *
 *   calculator result
 *       ↓
 *   HTTP response
 *       ↓
 *   STOP
 *
 * In 002-004:
 *
 *   calculator result
 *       ↓
 *   function_call_output
 *       ↓
 *   MODEL AGAIN
 *
 *
 * CALL ID
 * --------------------------------
 * `call_id` connects a model's requested function call with the observation
 * produced by the application.
 *
 * Model request:
 *
 *   function_call
 *   call_id: "call_abc123"
 *
 * Application observation:
 *
 *   function_call_output
 *   call_id: "call_abc123"
 *
 * Conceptually:
 *
 *   function_call                 function_call_output
 *   -----------------             --------------------
 *   call_id: call_abc123  ──────→ call_id: call_abc123
 *   calculator(...)               output: "1161"
 *
 * This tells the model:
 *
 *   "This output belongs to that function call."
 *
 *
 * PREVIOUS_RESPONSE_ID
 * --------------------------------
 * After executing the calculator, we call the model again:
 *
 *   response = await openai.responses.create({
 *       model: "gpt-5.6-luna",
 *       previous_response_id: response.id,
 *       input: [toolOutput],
 *       tools: [calculatorTool],
 *   });
 *
 * `previous_response_id` continues from the previous response.
 *
 * That means the next model call can continue working on the original goal
 * while receiving the new tool observation.
 *
 * For example, after receiving:
 *
 *   1161
 *
 * the model still knows that the original task also asked it to:
 *
 *   multiply that result by 10
 *
 *
 * WHY `let response` INSTEAD OF `const response`
 * --------------------------------
 * The first model call creates:
 *
 *   let response = await openai.responses.create(...)
 *
 * We use `let` because each trip around the loop replaces `response` with
 * the newest model response:
 *
 *   response = await openai.responses.create(...)
 *
 * Conceptually:
 *
 *   response = Model #1 response
 *       ↓
 *   execute tool
 *       ↓
 *   response = Model #2 response
 *       ↓
 *   execute tool
 *       ↓
 *   response = Model #3 response
 *       ↓
 *   final answer
 *
 *
 * WHY `.find()` INSTEAD OF `response.output[0]`
 * --------------------------------
 * In 002-003 we used:
 *
 *   const output = response.output[0];
 *
 * That was a deliberate teaching simplification.
 *
 * But `response.output` is heterogeneous.
 *
 * It can contain different kinds of output items, for example:
 *
 *   response.output[0] → reasoning
 *   response.output[1] → message
 *   response.output[2] → function_call
 *
 * We observed exactly this kind of structure while experimenting with a
 * prompt that asked the model to print text and then use the calculator.
 *
 * Therefore this is NOT reliable:
 *
 *   response.output[0]
 *
 * because the first output item is not guaranteed to be a function call.
 *
 * Instead we search for the item we actually need:
 *
 *   const toolCall = response.output.find(
 *       (item) => item.type === "function_call",
 *   );
 *
 * Now the function call can appear anywhere in `response.output`.
 *
 *
 * WHY `.find()` RATHER THAN `.filter()` RIGHT NOW
 * --------------------------------
 * We intentionally use:
 *
 *   .find(...)
 *
 * rather than:
 *
 *   .filter(...)
 *
 * in this lesson.
 *
 * `.find()` gives us one matching function call.
 *
 * That keeps 002-004 focused on its main concept:
 *
 *   ONE requested calculator action
 *       ↓
 *   execute it
 *       ↓
 *   return observation
 *       ↓
 *   ask model again
 *       ↓
 *   repeat
 *
 * This does NOT mean a model response can never contain multiple function
 * calls.
 *
 * It means we are deliberately keeping the implementation boundary small
 * while learning the agent loop.
 *
 * Broader multiple-tool-call handling belongs to 002-005.
 *
 *
 * WHY `calculatorTool` IS EXTRACTED
 * --------------------------------
 * Earlier lessons defined the tool directly inside:
 *
 *   tools: [
 *       {
 *           type: "function",
 *           ...
 *       }
 *   ]
 *
 * In this lesson we extracted it:
 *
 *   const calculatorTool = {
 *       type: "function" as const,
 *       ...
 *   };
 *
 * and then use:
 *
 *   tools: [calculatorTool]
 *
 * This extraction is NOT required for an agent loop.
 *
 * These two approaches are functionally equivalent.
 *
 * Extracting the object does not give the agent new capabilities and does
 * not make tool execution faster.
 *
 * We do it because the same tool definition is now supplied to multiple
 * model calls, and extracting it keeps the agent-loop code easier to read.
 *
 * It also avoids repeating the entire tool schema.
 *
 * The `as const` on:
 *
 *   type: "function" as const
 *
 * preserves the literal type `"function"` when the object is declared
 * separately.
 *
 * When the object is written directly inside the SDK call, TypeScript can
 * often infer the expected literal type from the surrounding `tools`
 * parameter.
 *
 *
 * HOW THE LOOP STOPS
 * --------------------------------
 * Every iteration searches the newest model response:
 *
 *   const toolCall = response.output.find(
 *       (item) => item.type === "function_call",
 *   );
 *
 * If a function call exists:
 *
 *   execute tool
 *       ↓
 *   send observation
 *       ↓
 *   ask model again
 *       ↓
 *   continue loop
 *
 * If no function call exists:
 *
 *   if (!toolCall) {
 *       return Response.json(...)
 *   }
 *
 * Returning the HTTP response exits the Route Handler, which also ends the
 * `while (true)` loop.
 *
 * So `while (true)` does NOT mean that this successful path must run
 * forever.
 *
 * The model producing a response without a function call is the termination
 * condition in this lesson.
 *
 *
 * MODEL DECISION VS APPLICATION EXECUTION
 * --------------------------------
 * The responsibility boundary remains the same:
 *
 *   MODEL
 *     ↓
 *   decides WHAT action it wants
 *
 *   APPLICATION
 *     ↓
 *   decides HOW that action is implemented
 *     ↓
 *   executes calculator()
 *
 * The new part is that the application now reports the result back to the
 * model so the model can make another decision.
 *
 *
 * CURRENT LESSON BOUNDARY
 * --------------------------------
 * 002-004 teaches:
 *
 *   ✓ repeated model decisions
 *   ✓ repeated calculator execution
 *   ✓ function_call_output
 *   ✓ call_id correlation
 *   ✓ previous_response_id
 *   ✓ loop termination
 *   ✓ searching heterogeneous response.output with `.find()`
 *
 * We intentionally do NOT add:
 *
 *   ✗ multiple different tool capabilities
 *   ✗ broader multiple-tool-call dispatch
 *   ✗ maximum-iteration safety guard
 *   ✗ agent UI
 *
 *
 * NEXT — 002-005 Multiple Tool Calls
 * --------------------------------
 * The next lesson expands beyond this lesson's single calculator capability.
 *
 * For example:
 *
 *   calculator(...)
 *       ↓
 *   calculator(...)
 *       ↓
 *   formatNumber(...)
 *       ↓
 *   Final Answer
 *
 * Curriculum progression:
 *
 *   002-003 → execute one real tool
 *   002-004 → repeat model → tool → observation → model
 *   002-005 → handle multiple tool capabilities / calls
 *   002-006 → add a safety guard
 *   002-007 → build the Agent UI
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
 * Test 1 — Multiple agent-loop iterations:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool to multiply 27 by 43. Then multiply that result by 10."}' | jq
 *
 * Expected important result:
 *
 *   {
 *     "type": "message",
 *     "text": "11,610"
 *   }
 *
 * Exact final formatting can be model-generated.
 *
 *
 * Test 2 — No tool required:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Say hello in one short sentence."}' | jq
 *
 * Expected:
 *
 *   {
 *     "type": "message",
 *     "text": "Hello!"
 *   }
 *
 * Exact wording can vary.
 *
 *
 * Test 3 — One calculator step:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool to multiply 27 by 43."}' | jq
 *
 * Expected final result:
 *
 *   1161
 *
 *
 * Test 4 — Empty prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":""}'
 *
 * Expected: HTTP 400
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
 * Expected: HTTP 400
 *
 *
 * Test 6 — Non-string prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":123}'
 *
 * Expected: HTTP 400
 *
 *
 * At the end of 002-004:
 *
 *   User Goal
 *       ↓
 *   Model
 *       ↓
 *   Decision
 *      ┌┴──────────────────────────────┐
 *      ↓                               ↓
 * function_call                     message
 *      ↓                               ↓
 * calculator()                     final answer
 *      ↓
 * result
 *      ↓
 * function_call_output
 *      ↓
 * Model again
 *      ↓
 * repeat until no function_call
 *
 * This repeated decision → action → observation cycle is the agent loop.
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

    // Start the first model turn.
    //
    // The calculator TOOL DEFINITION tells the model what action it may
    // request. It remains separate from the real TypeScript `calculator()`
    // implementation imported above.
    let response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
        tools: [calculatorTool],
    });

    // Keep asking the model what to do until it stops requesting a tool.
    //
    // There is intentionally no maximum-iteration guard yet.
    // That safety concept belongs to lesson 002-006.
    while (true) {
        // `response.output` can contain different kinds of items.
        //
        // Do not assume `response.output[0]` is a function call.
        // Search for the output item we actually need.
        //
        // We intentionally use `.find()` rather than `.filter()` in this
        // lesson because 002-004 executes one requested calculator action
        // per loop iteration. Broader multiple-call handling comes next.
        const toolCall = response.output.find(
            (item) => item.type === "function_call",
        );

        // No function call means the model is finished requesting actions.
        //
        // Returning here ends both the Route Handler and the agent loop.
        if (!toolCall) {
            return Response.json({
                type: "message",
                text: response.output_text,
                output: response.output,
            });
        }

        // OpenAI gives function-call arguments to us as a JSON string.
        //
        // Parse that string before passing the values to our application
        // implementation.
        const arguments_ = JSON.parse(toolCall.arguments) as {
            operation: CalculatorOperation;
            a: number;
            b: number;
        };

        // The MODEL requested the action.
        //
        // The APPLICATION performs the real deterministic calculation.
        const result = calculator(
            arguments_.operation,
            arguments_.a,
            arguments_.b,
        );

        // Turn the application result into an observation for the model.
        //
        // `call_id` connects this output to the function call that requested
        // it.
        const toolOutput = {
            type: "function_call_output" as const,
            call_id: toolCall.call_id,
            output: String(result),
        };

        // Send the observation back to the model.
        //
        // `previous_response_id` continues the previous interaction, allowing
        // the model to continue working toward the original goal.
        //
        // Assign the new response back to `response`. When the loop starts
        // again, we inspect this NEW model decision.
        response = await openai.responses.create({
            model: "gpt-5.6-luna",
            previous_response_id: response.id,
            input: [toolOutput],
            tools: [calculatorTool],
        });
    }
}