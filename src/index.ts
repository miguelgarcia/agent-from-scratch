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
      if (resp.type == "tool") {
        console.log(`Tool output: ${resp.toolCallId}:`)
      }
      if (resp.content) {
        console.log(resp.content);
      }
      if (resp.type == "ai") {
        console.log("tools:")
        console.log(resp.toolCalls);
      }
      if (resp.type == "interrupt") {
        rl.question("answer > ", (ans) => {
          resp.answer(ans.trim());
        });
      }
    }
    rl.prompt();
  }
}

rl.setPrompt(`${magenta}>${reset} `);
rl.prompt();
main();
