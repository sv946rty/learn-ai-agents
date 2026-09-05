/**
 * Lesson 002-005 — Multiple Tool Calls
 *
 * PAST — 002-004 Agent Loop
 * --------------------------------
 * In the previous lesson, our application learned how to repeat:
 *
 *   Model
 *      ↓
 *   function_call
 *      ↓
 *   calculator(...)
 *      ↓
 *   result
 *      ↓
 *   function_call_output
 *      ↓
 *   Model again
 *      ↓
 *   repeat until no function_call
 *
 * This gave us our first real agent loop.
 *
 * Example:
 *
 *   "Multiply 27 by 43.
 *    Then multiply that result by 10."
 *
 * Conceptually:
 *
 *   Model #1
 *      ↓
 *   calculator(27, 43)
 *      ↓
 *   1161
 *      ↓
 *   Model #2
 *      ↓
 *   calculator(1161, 10)
 *      ↓
 *   11610
 *      ↓
 *   Model #3
 *      ↓
 *   Final Answer
 *
 * But 002-004 deliberately made two simplifying assumptions:
 *
 *   1. The application had only ONE tool capability:
 *
 *        calculator
 *
 *   2. We handled only ONE function_call from each model response:
 *
 *        response.output.find(...)
 *
 *
 * NOW — 002-005 Multiple Tool Calls
 * --------------------------------
 * This lesson removes both simplifications.
 *
 * The model now has TWO application capabilities:
 *
 *   calculator
 *   format_number
 *
 * And the application can handle MULTIPLE function_call items returned
 * together in one model response.
 *
 * So 002-005 introduces two related but DIFFERENT ideas:
 *
 *   A. MULTIPLE TOOL TYPES
 *
 *      calculator
 *      format_number
 *
 *   B. MULTIPLE FUNCTION CALLS IN ONE MODEL RESPONSE
 *
 *      function_call #1
 *      function_call #2
 *      ...
 *
 * Do not confuse these two concepts.
 *
 *
 * MULTIPLE TOOL TYPES
 * --------------------------------
 * A model can now choose WHICH application capability it needs.
 *
 * For example:
 *
 *   calculator(...)
 *
 * means:
 *
 *   execute the application-side calculator()
 *
 * while:
 *
 *   format_number(...)
 *
 * means:
 *
 *   execute the application-side formatNumber()
 *
 * Conceptually:
 *
 *                           ┌──→ calculator()
 *                           │
 *   Model → function_call ──┤
 *                           │
 *                           └──→ formatNumber()
 *
 * The model chooses WHAT tool it wants.
 *
 * The application decides HOW that named tool is actually implemented.
 *
 *
 * TOOL DEFINITION ≠ TOOL IMPLEMENTATION
 * --------------------------------
 * These objects:
 *
 *   calculatorTool
 *   formatNumberTool
 *
 * are MODEL-FACING definitions.
 *
 * They describe capabilities that the model may request.
 *
 * These functions:
 *
 *   calculator()
 *   formatNumber()
 *
 * are APPLICATION-SIDE implementations.
 *
 * Merely defining:
 *
 *   formatNumber()
 *
 * does NOT make the model aware of it.
 *
 * And merely advertising:
 *
 *   format_number
 *
 * does NOT automatically connect it to formatNumber().
 *
 * The application must explicitly dispatch the model's requested tool name
 * to the correct implementation.
 *
 *
 * EXPERIMENT — THE CORRECT-LOOKING WRONG ANSWER
 * --------------------------------
 * Before we added proper tool dispatch, we exposed both tools to the model:
 *
 *   tools: [calculatorTool, formatNumberTool]
 *
 * But our application still executed EVERY function call as if it were a
 * calculator call.
 *
 * We tested:
 *
 *   "Use the calculator tool to multiply 27 by 43.
 *    Then multiply that result by 10.
 *    Finally, use the format_number tool to format that result."
 *
 * The actual runtime was:
 *
 *   calculator(27, 43)
 *       ↓
 *   1161
 *
 *   calculator(1161, 10)
 *       ↓
 *   11610
 *
 *   format_number({ value: 11610 })
 *       ↓
 *   application incorrectly treated it as calculator arguments
 *       ↓
 *   undefined
 *
 * The application therefore returned:
 *
 *   function_call_output
 *   output: "undefined"
 *
 * But the model still eventually produced:
 *
 *   "11,610"
 *
 * This gives us an important agent-engineering lesson:
 *
 *   A correct-looking FINAL ANSWER does NOT prove that the tool pipeline
 *   executed correctly.
 *
 * We must inspect tool requests and tool results while developing agents.
 *
 *
 * TOOL DISPATCH
 * --------------------------------
 * To support multiple tool types, we inspect:
 *
 *   toolCall.name
 *
 * and explicitly dispatch to the corresponding implementation.
 *
 * Conceptually:
 *
 *   toolCall.name === "calculator"
 *       ↓
 *   calculator(...)
 *
 *   toolCall.name === "format_number"
 *       ↓
 *   formatNumber(...)
 *
 * This is the bridge between:
 *
 *   MODEL-FACING TOOL NAME
 *
 * and:
 *
 *   APPLICATION-SIDE FUNCTION
 *
 *
 * DEPENDENT / SEQUENTIAL TOOL CALLS
 * --------------------------------
 * Some actions depend on previous tool results.
 *
 * Example:
 *
 *   "Multiply 27 by 43.
 *    Then multiply that result by 10.
 *    Finally, format the result with commas."
 *
 * The later calls require earlier results.
 *
 * The model cannot know the second calculator arguments until it receives
 * the first result.
 *
 * Conceptually:
 *
 *   Model #1
 *      ↓
 *   calculator(27, 43)
 *      ↓
 *   1161
 *      ↓
 *   Model #2
 *      ↓
 *   calculator(1161, 10)
 *      ↓
 *   11610
 *      ↓
 *   Model #3
 *      ↓
 *   format_number(11610)
 *      ↓
 *   "11,610"
 *      ↓
 *   Model #4
 *      ↓
 *   Final Answer
 *
 * These are MULTIPLE TOOL CALLS ACROSS MULTIPLE MODEL TURNS.
 *
 * Each next action depends on an observation from the previous action.
 *
 *
 * INDEPENDENT TOOL CALLS
 * --------------------------------
 * Other actions do NOT depend on one another.
 *
 * Example:
 *
 *   "Use the calculator tool to do two independent calculations:
 *
 *    1. multiply 27 by 43
 *    2. multiply 15 by 20
 *
 *    Give me both results."
 *
 * The model already knows all arguments:
 *
 *   calculator(27, 43)
 *   calculator(15, 20)
 *
 * Therefore ONE model response can contain BOTH function calls:
 *
 *                         ┌──→ calculator(27, 43)
 *                         │
 *   Model Response ───────┤
 *                         │
 *                         └──→ calculator(15, 20)
 *
 * The application must execute both requested actions and return both
 * observations before continuing the conversation.
 *
 *
 * WHY `.filter()` INSTEAD OF `.find()`
 * --------------------------------
 * In 002-004 we intentionally used:
 *
 *   response.output.find(
 *       (item) => item.type === "function_call",
 *   );
 *
 * `.find()` returns ONE matching item.
 *
 * That was appropriate for the 002-004 teaching boundary because we were
 * focused on understanding:
 *
 *   Model → Tool → Observation → Model
 *
 * But in 002-005 we experimentally proved that one response can contain
 * multiple function_call items.
 *
 * Therefore we now use:
 *
 *   response.output.filter(
 *       (item) => item.type === "function_call",
 *   );
 *
 * Conceptually:
 *
 *   002-004
 *
 *   response.output
 *       ↓
 *     .find()
 *       ↓
 *   toolCall
 *
 *
 *   002-005
 *
 *   response.output
 *       ↓
 *     .filter()
 *       ↓
 *   toolCalls[]
 *
 *
 * EXPERIMENT — WHY `.find()` FAILED
 * --------------------------------
 * We tested two independent calculations:
 *
 *   calculator(27, 43)
 *   calculator(15, 20)
 *
 * The model requested multiple function calls in one response.
 *
 * But our old `.find()` implementation selected only the first call:
 *
 *   calculator(27, 43)
 *       ↓
 *   1161
 *
 * We returned only that one function_call_output.
 *
 * The second requested call received NO observation.
 *
 * OpenAI correctly rejected the continuation with:
 *
 *   400 No tool output found for function call ...
 *
 * Conceptually:
 *
 *   MODEL REQUESTS                    APPLICATION RETURNS
 *
 *   call A: calculator(27,43) ─────→ output A: 1161   ✓
 *
 *   call B: calculator(15,20) ─────→ NOTHING          ✗
 *
 * This directly demonstrated why `.find()` is insufficient once a model
 * response contains multiple requested calls.
 *
 *
 * TOOL OUTPUTS — PLURAL
 * --------------------------------
 * After `.filter()`, we have:
 *
 *   toolCalls[]
 *
 * We transform every requested call into its corresponding observation:
 *
 *   const toolOutputs = toolCalls.map(...)
 *
 * Conceptually:
 *
 *   toolCalls[]
 *       ↓
 *      .map()
 *       ↓
 *   execute every requested tool
 *       ↓
 *   toolOutputs[]
 *
 * Example:
 *
 *   call_A: calculator(27, 43)
 *       ↓
 *   result: 1161
 *       ↓
 *   function_call_output
 *   call_id: call_A
 *
 *
 *   call_B: calculator(15, 20)
 *       ↓
 *   result: 300
 *       ↓
 *   function_call_output
 *   call_id: call_B
 *
 * We then send BOTH observations:
 *
 *   input: toolOutputs
 *
 * before asking the model to decide again.
 *
 *
 * WHY `call_id` IS EVEN MORE IMPORTANT HERE
 * --------------------------------
 * With one function call, the relationship was already useful:
 *
 *   call_A ───→ output_A
 *
 * With multiple calls, the correlation becomes especially obvious:
 *
 *   call_A ───→ output_A
 *   call_B ───→ output_B
 *
 * Each function_call_output preserves the call_id of the exact request that
 * produced it.
 *
 * That lets the model/API correlate multiple observations with multiple
 * requested actions.
 *
 *
 * MULTIPLE CALLS DOES NOT NECESSARILY MEAN PARALLEL JAVASCRIPT
 * --------------------------------
 * `toolCalls.map(...)` in this lesson executes our calculator and formatter
 * synchronously.
 *
 * We are teaching:
 *
 *   multiple function calls requested in ONE model response
 *
 * We are NOT teaching:
 *
 *   concurrent / asynchronous JavaScript execution
 *
 * Those are different concepts.
 *
 * The important architectural change is that we handle ALL requested calls
 * before returning observations to the model.
 *
 * WHY DO WE NEED BOTH `while (true)` AND `toolCalls.map(...)`?
 * --------------------------------
 * At first these may look like two ways of doing the same thing.
 *
 * After all:
 *
 *   while (...)   repeats work
 *   .map(...)     repeats work
 *
 * But they solve TWO DIFFERENT PROBLEMS at TWO DIFFERENT LEVELS.
 *
 * A useful mental model is:
 *
 *   while (true)       = DEPTH across MODEL TURNS
 *
 *   toolCalls.map(...) = BREADTH across TOOL CALLS
 *                        inside ONE model turn
 *
 *
 * `while (true)` — KEEP THE AGENT MOVING ACROSS MODEL TURNS
 * --------------------------------
 * `while (true)` is the OUTER agent loop.
 *
 * It exists because the model may need to:
 *
 *   decide
 *      ↓
 *   use a tool
 *      ↓
 *   observe the result
 *      ↓
 *   decide again
 *      ↓
 *   use another tool
 *      ↓
 *   observe again
 *      ↓
 *   ...
 *
 * We often cannot know ahead of time how many model turns will be required.
 *
 * Consider our DEPENDENT example:
 *
 *   "Multiply 27 by 43.
 *    Then multiply that result by 10.
 *    Finally, format the result."
 *
 * The execution is:
 *
 *   while iteration #1
 *
 *       MODEL TURN #1
 *           ↓
 *       calculator(27, 43)
 *           ↓
 *       1161
 *           ↓
 *       send observation back to model
 *
 *
 *   while iteration #2
 *
 *       MODEL TURN #2
 *           ↓
 *       calculator(1161, 10)
 *           ↓
 *       11610
 *           ↓
 *       send observation back to model
 *
 *
 *   while iteration #3
 *
 *       MODEL TURN #3
 *           ↓
 *       format_number(11610)
 *           ↓
 *       "11,610"
 *           ↓
 *       send observation back to model
 *
 *
 *   while iteration #4
 *
 *       MODEL TURN #4
 *           ↓
 *       no function_call
 *           ↓
 *       FINAL ANSWER
 *
 * Why couldn't we just execute all three calls immediately?
 *
 * Because they are DEPENDENT.
 *
 * When Model #1 asks for:
 *
 *   calculator(27, 43)
 *
 * Model #2 does not yet have the observation:
 *
 *   1161
 *
 * Therefore it cannot yet construct:
 *
 *   calculator(1161, 10)
 *
 * And until that produces:
 *
 *   11610
 *
 * the model cannot construct:
 *
 *   format_number(11610)
 *
 * So the application must repeatedly return observations to the model and
 * give it another opportunity to decide.
 *
 * That is what `while (true)` gives us:
 *
 *   MODEL TURN #1
 *       ↓
 *   MODEL TURN #2
 *       ↓
 *   MODEL TURN #3
 *       ↓
 *   MODEL TURN #4
 *
 * Think of this as DEPTH:
 *
 *   How many model → action → observation cycles does this task require?
 *
 *
 * `toolCalls.map(...)` — HANDLE EVERY CALL IN THIS MODEL TURN
 * --------------------------------
 * `.map()` solves a different problem.
 *
 * One individual model response may already contain MULTIPLE function calls.
 *
 * Consider our INDEPENDENT example:
 *
 *   "Use the calculator tool to do two independent calculations:
 *
 *    1. multiply 27 by 43
 *    2. multiply 15 by 20"
 *
 * The model already knows every argument needed for BOTH calculations.
 *
 * Therefore ONE model response may contain:
 *
 *   MODEL TURN #1
 *
 *       response.output
 *           │
 *           ├── function_call A
 *           │     calculator(27, 43)
 *           │
 *           └── function_call B
 *                 calculator(15, 20)
 *
 * `.filter()` collects those calls:
 *
 *   const toolCalls = response.output.filter(
 *       (item) => item.type === "function_call",
 *   );
 *
 * giving us conceptually:
 *
 *   toolCalls = [
 *       call_A,
 *       call_B,
 *   ];
 *
 * Now the application must execute EVERY item in that array.
 *
 * That is what:
 *
 *   toolCalls.map(...)
 *
 * does.
 *
 * Conceptually:
 *
 *                   toolCalls[]
 *                        │
 *               ┌────────┴────────┐
 *               │                 │
 *             call_A            call_B
 *               │                 │
 *               ↓                 ↓
 *       calculator(27,43) calculator(15,20)
 *               │                 │
 *               ↓                 ↓
 *             1161               300
 *               │                 │
 *               ↓                 ↓
 *            output_A          output_B
 *               │                 │
 *               └────────┬────────┘
 *                        ↓
 *                   toolOutputs[]
 *
 * So `.map()` means:
 *
 *   "For EACH tool call requested in THIS model response,
 *    execute it and create its corresponding observation."
 *
 *
 * WHY NOT USE `while` INSTEAD OF `.map()`?
 * --------------------------------
 * Because these calls belong to the SAME model response.
 *
 * The model has already requested:
 *
 *   call_A
 *   call_B
 *
 * before we ask the model anything else.
 *
 * We need to satisfy BOTH requests:
 *
 *   call_A → output_A
 *   call_B → output_B
 *
 * and then return:
 *
 *   input: toolOutputs
 *
 * to the next model turn.
 *
 * If we handled only call_A and immediately went around the outer agent loop,
 * call_B would still be missing its required observation.
 *
 * We experimentally saw exactly this problem with the old `.find()` code:
 *
 *   MODEL REQUESTS                  APPLICATION RETURNED
 *
 *   call_A ───────────────────────→ output_A   ✓
 *   call_B ───────────────────────→ nothing    ✗
 *
 * OpenAI rejected that continuation:
 *
 *   400 No tool output found for function call ...
 *
 * WHY NOT USE ONLY `.map()` AND REMOVE `while (true)`?
 * --------------------------------
 * Because `.map()` handles only the calls that ALREADY EXIST in the CURRENT
 * model response.
 *
 * It cannot predict future tool calls that the model has not requested yet.
 *
 * For our dependent example, Model #1 may contain only:
 *
 *   calculator(27, 43)
 *
 * `.map()` can execute that call:
 *
 *   calculator(27, 43)
 *       ↓
 *   1161
 *
 * But `.map()` cannot decide that the next action should be:
 *
 *   calculator(1161, 10)
 *
 * That decision belongs to the MODEL.
 *
 * We therefore return 1161 to the model.
 *
 * The NEXT model response may then request:
 *
 *   calculator(1161, 10)
 *
 * The outer `while (true)` is what allows that next model turn to happen.
 *
 *
 * PUTTING THEM TOGETHER
 * --------------------------------
 * The complete architecture therefore has TWO dimensions:
 *
 *
 *   DEPTH — `while (true)`
 *
 *       Model #1
 *           ↓
 *       Model #2
 *           ↓
 *       Model #3
 *           ↓
 *       Model #4
 *
 *
 *   BREADTH — `toolCalls.map(...)`
 *
 *                   Model #1
 *                      │
 *                ┌─────┴─────┐
 *                ↓           ↓
 *             call_A       call_B
 *                ↓           ↓
 *            output_A     output_B
 *                └─────┬─────┘
 *                      ↓
 *                   Model #2
 *
 *
 * And they can happen TOGETHER:
 *
 *                    while iteration #1
 *
 *                         Model #1
 *                            │
 *                       toolCalls[]
 *                            │
 *                      ┌─────┴─────┐
 *                      ↓           ↓
 *                   call_A       call_B
 *                      ↓           ↓
 *                  output_A     output_B
 *                      └─────┬─────┘
 *                            ↓
 *                       toolOutputs[]
 *                            │
 *                            ↓
 *
 *                    while iteration #2
 *
 *                         Model #2
 *                            │
 *                           ...
 *
 *
 * So remember:
 *
 *   `while (true)`
 *       = "Does the AGENT need another MODEL TURN?"
 *
 *   `toolCalls.map(...)`
 *       = "What do we do with ALL TOOL CALLS requested in THIS TURN?"
 *
 *
 * Or even shorter:
 *
 *   while = DEPTH
 *   map   = BREADTH
 *
 *
 * ONE MORE IMPORTANT DISTINCTION
 * --------------------------------
 * `.map()` here does NOT mean that the tools execute concurrently.
 *
 * In this lesson:
 *
 *   toolCalls.map(...)
 *
 * synchronously visits each requested call and builds a new array:
 *
 *   toolCalls[]
 *       ↓
 *   toolOutputs[]
 *
 * We are NOT teaching:
 *
 *   Promise.all(...)
 *   async concurrency
 *   parallel tool execution
 *
 * The important concept is not execution speed.
 *
 * The important concept is:
 *
 *   ONE model response can request MANY actions,
 *   and EVERY requested action must receive an observation.
 *
 * HOW THE LOOP STOPS
 * --------------------------------
 * Every iteration now collects ALL function calls:
 *
 *   const toolCalls = response.output.filter(
 *       (item) => item.type === "function_call",
 *   );
 *
 * If there are none:
 *
 *   if (toolCalls.length === 0) {
 *       return Response.json(...)
 *   }
 *
 * the model has stopped requesting actions and the Route Handler returns the
 * final answer.
 *
 * If one or more function calls exist:
 *
 *   execute every requested call
 *       ↓
 *   create every function_call_output
 *       ↓
 *   send toolOutputs[]
 *       ↓
 *   ask model again
 *       ↓
 *   repeat
 *
 *
 * CURRENT LESSON BOUNDARY
 * --------------------------------
 * 002-005 teaches:
 *
 *   ✓ multiple tool definitions
 *   ✓ multiple application implementations
 *   ✓ dispatch by toolCall.name
 *   ✓ dependent/sequential tool calls across model turns
 *   ✓ independent calls in one model response
 *   ✓ `.filter()` instead of `.find()`
 *   ✓ toolCalls[] → toolOutputs[]
 *   ✓ one function_call_output for every requested call
 *   ✓ call_id correlation across multiple calls
 *
 * We intentionally do NOT add:
 *
 *   ✗ maximum-iteration safety guard
 *   ✗ runtime schema validation
 *   ✗ divide-by-zero safety handling
 *   ✗ Agent UI
 *
 *
 * NEXT — 002-006 Safety Guard
 * --------------------------------
 * Our loop still uses:
 *
 *   while (true)
 *
 * and currently trusts the model/tool cycle to eventually terminate.
 *
 * In the next lesson we will introduce a safety boundary so an agent cannot
 * continue requesting actions forever.
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
 * These tests exercise the important execution paths introduced in this
 * lesson as well as behavior inherited from earlier lessons.
 *
 * Prerequisite:
 *
 *   pnpm dev
 *
 *
 * Test 1 — Multiple tool TYPES across DEPENDENT model turns
 * --------------------------------
 * This verifies sequential/dependent tool use.
 *
 * Later actions require results from earlier actions, so the model must make
 * several decisions across several turns.
 *
 * Run:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool to multiply 27 by 43. Then multiply that result by 10. Finally, use the format_number tool to format that result."}' | jq
 *
 * Expected application execution:
 *
 *   Model #1
 *       ↓
 *   calculator(27, 43)
 *       ↓
 *   1161
 *
 *   Model #2
 *       ↓
 *   calculator(1161, 10)
 *       ↓
 *   11610
 *
 *   Model #3
 *       ↓
 *   format_number(11610)
 *       ↓
 *   "11,610"
 *
 *   Model #4
 *       ↓
 *   no function_call
 *       ↓
 *   Final Answer
 *
 * During our test, the server log confirmed:
 *
 *   TOOL CALLS: [
 *       calculator(27, 43)
 *   ]
 *   TOOL RESULT: calculator 1161
 *
 *   TOOL CALLS: [
 *       calculator(1161, 10)
 *   ]
 *   TOOL RESULT: calculator 11610
 *
 *   TOOL CALLS: [
 *       format_number(11610)
 *   ]
 *   TOOL RESULT: format_number 11,610
 *
 *   TOOL CALLS: []
 *
 * Expected final semantic result:
 *
 *   11,610
 *
 * IMPORTANT:
 *
 * This test is not merely checking whether the final text looks correct.
 *
 * Earlier in development, the model produced the correct-looking final text
 * "11,610" even though our application had incorrectly executed
 * format_number as a calculator call and produced:
 *
 *   undefined
 *
 * Therefore the TOOL RESULT log is important evidence that the real
 * formatNumber() implementation executed successfully.
 *
 *
 * Test 2 — Multiple INDEPENDENT calls in ONE model response
 * --------------------------------
 * This verifies the main `.find()` → `.filter()` change in 002-005.
 *
 * Run:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool to do two independent calculations: (1) multiply 27 by 43, and (2) multiply 15 by 20. Give me both results."}' | jq
 *
 * Both calculations have all their arguments available immediately.
 *
 * Therefore the model may request both calls in ONE response:
 *
 *   TOOL CALLS: [
 *       calculator(27, 43),
 *       calculator(15, 20)
 *   ]
 *
 * During our test, the server log confirmed exactly that behavior:
 *
 *   TOOL CALLS: [
 *       {
 *           name: "calculator",
 *           arguments: {
 *               operation: "multiply",
 *               a: 27,
 *               b: 43
 *           }
 *       },
 *       {
 *           name: "calculator",
 *           arguments: {
 *               operation: "multiply",
 *               a: 15,
 *               b: 20
 *           }
 *       }
 *   ]
 *
 * followed by:
 *
 *   TOOL RESULT: calculator 1161
 *   TOOL RESULT: calculator 300
 *   TOOL CALLS: []
 *
 * Expected semantic results:
 *
 *   27 × 43 = 1161
 *   15 × 20 = 300
 *
 * During our test, the model presented them as:
 *
 *   27 × 43 = 1,161
 *   15 × 20 = 300
 *
 * The comma in "1,161" was presentation generated by the model.
 * This test did NOT require the format_number tool.
 *
 *
 * Test 3 — Historical failure with `.find()`
 * --------------------------------
 * We performed this test BEFORE fixing the multiple-call implementation.
 *
 * It is documented here because it explains WHY the 002-005 architecture
 * changed.
 *
 * With the same independent-calculations prompt, the model requested:
 *
 *   call_A → calculator(27, 43)
 *   call_B → calculator(15, 20)
 *
 * But the old 002-004 code used:
 *
 *   response.output.find(
 *       (item) => item.type === "function_call",
 *   );
 *
 * `.find()` selected only call_A.
 *
 * The application returned:
 *
 *   call_A → function_call_output("1161")
 *
 * but returned NOTHING for call_B.
 *
 * OpenAI therefore rejected the continuation:
 *
 *   400 No tool output found for function call ...
 *
 * Conceptually:
 *
 *   MODEL REQUESTS                    OLD APPLICATION
 *
 *   call_A ─────────────────────────→ output_A   ✓
 *   call_B ─────────────────────────→ missing    ✗
 *
 * This failure is the experimental reason 002-005 evolves to:
 *
 *   .filter()
 *       ↓
 *   toolCalls[]
 *       ↓
 *   .map()
 *       ↓
 *   toolOutputs[]
 *
 * so EVERY requested function call receives a corresponding observation.
 *
 *
 * Test 4 — No tool required
 * --------------------------------
 * This verifies that the agent can still answer directly when no application
 * capability is needed.
 *
 * Run:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Say hello in one short sentence."}' | jq
 *
 * During our test, the response was:
 *
 *   "Hello! 👋"
 *
 * Exact wording may vary because this is model-generated text.
 *
 * The important server behavior is:
 *
 *   TOOL CALLS: []
 *
 * Conceptually:
 *
 *   User Prompt
 *       ↓
 *   Model
 *       ↓
 *   no function_call
 *       ↓
 *   toolCalls.length === 0
 *       ↓
 *   Final Answer
 *
 *
 * Test 5 — ONE calculator call
 * --------------------------------
 * This is a regression test for the simpler behavior introduced in earlier
 * lessons.
 *
 * Run:
 *
 *   curl -s -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Use the calculator tool to multiply 27 by 43."}' | jq
 *
 * During our test, the server log confirmed:
 *
 *   TOOL CALLS: [
 *       calculator(27, 43)
 *   ]
 *
 *   TOOL RESULT: calculator 1161
 *
 *   TOOL CALLS: []
 *
 * Expected semantic result:
 *
 *   1161
 *
 * This demonstrates an important property of the new plural architecture:
 *
 *   zero calls:
 *       toolCalls.length === 0
 *
 *   one call:
 *       toolCalls.length === 1
 *
 *   multiple calls:
 *       toolCalls.length > 1
 *
 * The same `.filter()` + `.map()` implementation naturally supports all
 * three cases.
 *
 *
 * Test 6 — Empty prompt
 * --------------------------------
 * This verifies the runtime prompt validation inherited from 001-003.
 *
 * Run:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":""}'
 *
 * Expected:
 *
 *   HTTP/1.1 400 Bad Request
 *
 *   {"error":"Prompt is required."}
 *
 * Our test returned exactly this result.
 *
 *
 * Test 7 — Whitespace-only prompt
 * --------------------------------
 * Run:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"   "}'
 *
 * Expected:
 *
 *   HTTP/1.1 400 Bad Request
 *
 *   {"error":"Prompt is required."}
 *
 * Our test returned exactly this result.
 *
 *
 * Test 8 — Non-string prompt
 * --------------------------------
 * Run:
 *
 *   curl -i -X POST http://localhost:3000/api/agents \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":123}'
 *
 * Expected:
 *
 *   HTTP/1.1 400 Bad Request
 *
 *   {"error":"Prompt is required."}
 *
 * Our test returned exactly this result.
 *
 *
 * Test 9 — Lint
 * --------------------------------
 * Run:
 *
 *   pnpm lint
 *
 * Expected:
 *
 *   ESLint completes with zero errors and zero warnings.
 *
 * Our 002-005 implementation passed this check.
 *
 *
 * 002-005 TEST MATRIX
 * --------------------------------
 *
 *   ✓ dependent calls across multiple model turns
 *
 *       calculator
 *           ↓
 *       calculator
 *           ↓
 *       format_number
 *
 *   ✓ multiple independent calls in one model response
 *
 *       Model
 *         ├──→ calculator
 *         └──→ calculator
 *
 *   ✓ multiple tool-name dispatch
 *
 *       calculator     → calculator()
 *       format_number  → formatNumber()
 *
 *   ✓ zero function calls
 *   ✓ one function call
 *   ✓ multiple function calls
 *
 *   ✓ one function_call_output for every requested call
 *
 *   ✓ empty-prompt validation
 *   ✓ whitespace-only validation
 *   ✓ non-string validation
 *
 *   ✓ pnpm lint
 *
 * NOTE:
 *
 * We have NOT run the final production build yet.
 *
 * `pnpm build` remains part of the lesson-completion workflow and will be
 * run after the lesson UI is updated.
 *
 *
 * At the end of 002-005:
 *
 *                           ┌──→ calculator()
 *                           │
 *   User Goal → Model ──────┼──→ calculator()
 *                           │
 *                           └──→ formatNumber()
 *                                  ↓
 *                         function_call_output(s)
 *                                  ↓
 *                              Model again
 *                                  ↓
 *                                repeat
 *                                  ↓
 *                             Final Answer
 *
 * The agent loop from 002-004 remains.
 *
 * What changes is that each model decision may now request different tools
 * and may contain more than one requested action.
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
    // We now advertise TWO model-facing capabilities:
    //
    //   calculator
    //   format_number
    //
    // These definitions remain separate from the real application-side
    // implementations:
    //
    //   calculator()
    //   formatNumber()
    let response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
        tools: [calculatorTool, formatNumberTool],
    });

    // Keep asking the model what to do until it stops requesting tools.
    //
    // There is intentionally still NO maximum-iteration guard.
    //
    // That safety concept belongs to lesson 002-006.
    while (true) {
        // `response.output` is heterogeneous and can contain reasoning,
        // messages, function calls, and other output-item types.
        //
        // 002-004 used `.find()` because that lesson intentionally handled
        // one requested function call at a time.
        //
        // 002-005 uses `.filter()` because one model response may contain
        // MULTIPLE function_call items.
        const toolCalls = response.output.filter(
            (item) => item.type === "function_call",
        );

        // Temporary teaching instrumentation.
        //
        // This lets us verify what the model actually requested instead of
        // assuming that a correct-looking final answer proves the tool
        // pipeline worked.
        console.log("TOOL CALLS:", toolCalls);

        // No function calls means the model is finished requesting actions.
        //
        // Returning here ends both the Route Handler and the agent loop.
        if (toolCalls.length === 0) {
            return Response.json({
                type: "message",
                text: response.output_text,
                output: response.output,
            });
        }

        // Execute EVERY function call requested in this model response.
        //
        // `.map()` transforms:
        //
        //   toolCalls[]
        //
        // into:
        //
        //   toolOutputs[]
        //
        // Each requested action receives its own function_call_output.
        const toolOutputs = toolCalls.map((toolCall) => {
            let result: number | string;

            // Dispatch by the MODEL-FACING tool name.
            //
            // The model chooses WHAT capability it wants.
            //
            // Our application explicitly connects that name to the real
            // TypeScript implementation.
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
                // We still fail explicitly rather than silently executing
                // the wrong application function.
                throw new Error(`Unknown tool: ${toolCall.name}`);
            }

            // Temporary teaching instrumentation.
            //
            // This is especially useful because our earlier experiment
            // produced a correct-looking final answer even though
            // `format_number` had incorrectly produced `undefined`.
            console.log("TOOL RESULT:", toolCall.name, result);

            // Turn this ONE application result into the observation that
            // corresponds to this ONE model-requested function call.
            //
            // Each output preserves its own call_id:
            //
            //   call_A → output_A
            //   call_B → output_B
            return {
                type: "function_call_output" as const,
                call_id: toolCall.call_id,
                output: String(result),
            };
        });

        // Send ALL observations from this model response back together.
        //
        // This is the key change from 002-004:
        //
        //   002-004:
        //       input: [toolOutput]
        //
        //   002-005:
        //       input: toolOutputs
        //
        // If the model requested two independent function calls, both
        // corresponding observations are supplied before the model makes
        // its next decision.
        response = await openai.responses.create({
            model: "gpt-5.6-luna",
            previous_response_id: response.id,
            input: toolOutputs,
            tools: [calculatorTool, formatNumberTool],
        });
    }
}