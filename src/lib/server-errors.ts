import { stderr } from "node:process";

type ServerErrorEvent = "registration_failed" | "friends_failed" | "database_initialization_failed";

/** Log a bounded error class without exposing exception messages or request values. */
export function reportServerError(event: ServerErrorEvent, error: Error): void {
  // Request values and raw exception messages may contain private location or account data.
  const errorType = ["TypeError", "RangeError", "SyntaxError", "ReferenceError"].includes(
    error.name,
  )
    ? error.name
    : "Error";

  stderr.write(`${JSON.stringify({ level: "error", event, error: errorType })}\n`);
}
