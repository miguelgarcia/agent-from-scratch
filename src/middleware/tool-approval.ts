import { Interrupt } from "../interrupt";
import { ToolMessage } from "../messages";
import type { Middleware } from "../agent";

/**
 * Per-tool-call human-in-the-loop approval. Yields an Interrupt for each
 * pending ToolCall in ctx.toolCalls. Tool calls whose answer is not "y" are
 * dropped from ctx.toolCalls; a "blocked by user" ToolMessage is yielded for
 * each and appended to ctx.messages so downstream model turns see it.
 */
export function toolApproval(): Middleware {
  return async function* (ctx, next) {
    const approved = [];
    for (const tc of ctx.toolCalls ?? []) {
      const it = new Interrupt(
        `Allow tool ${tc.toolName} with args: ${JSON.stringify(tc.arguments)}`,
      );
      yield it;
      const answer = await it.await();
      if (answer === "y") {
        approved.push(tc);
      } else {
        const msg = new ToolMessage("blocked by user", tc.id);
        ctx.messages.push(msg);
        yield msg;
      }
    }
    ctx.toolCalls = approved;
    yield* next();
  };
}
