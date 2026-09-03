export type CalculatorOperation =
    | "add"
    | "subtract"
    | "multiply"
    | "divide";

export function calculator(
    operation: CalculatorOperation,
    a: number,
    b: number,
) {
    switch (operation) {
        case "add":
            return a + b;

        case "subtract":
            return a - b;

        case "multiply":
            return a * b;

        case "divide":
            return a / b;
    }
}