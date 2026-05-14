/**
 * Main entry point. Takes care of terminal handling and delegates actual work on Agent.
 */
import readline from 'readline';
import { HumanMessage } from './messages';
import { Agent } from './agent';
import { runShell } from './tools/shell';
import { readFile } from './tools/readFile';
import { grep } from './tools/grep';
import { applyDiffs } from './tools/applyDiffs';
const magenta = "\x1b[35m";
const reset = "\x1b[0m";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const agent = new Agent({ tools: [runShell, readFile, grep, applyDiffs] });
  for await (const line of rl) {
    const input = line.trim();
    if (input === "/exit") {
      console.log("Hasta la vista!");
      process.exit(0);
    }
    for await (const resp of agent.invoke(new HumanMessage(input))) {
      // TODO: we should at least try to render markdown
      switch (resp.type) {
        case "tool":
          console.log(`Tool output: ${resp.toolCallId}:`)
          console.log(JSON.stringify(resp.content, null, 2));
          break;
        case "ai":
          if (resp.content) {
            console.log(resp.content)
          }
          if (resp.toolCalls?.length) {
            console.log("Tools to call:");
            for (let toolCall of resp.toolCalls) {
              console.log(`${toolCall.toolName} - (${JSON.stringify(toolCall.arguments)})`);
            }
          }
          break;
        case "interrupt":
          rl.question("answer > ", (ans) => {
            resp.answer(ans.trim());
          });
          break;
      }
    }
    rl.prompt();
  }
}

rl.setPrompt(`${magenta}>${reset} `);
rl.prompt();
main();
