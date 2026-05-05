/**
 * Main entry point. Takes care of terminal handling and delegates actual work on Agent.
 */
import readline from 'readline';
import { HumanMessage } from './messages';
import { Agent } from './agent';

const magenta = "\x1b[35m";
const reset = "\x1b[0m";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const agent = new Agent();
  for await (const line of rl) {
    const input = line.trim();
    if (input === "/exit") {
      console.log("Hasta la vista!");
      process.exit(0);
    }
    for await (const resp of agent.invoke(new HumanMessage(input))) {
      console.log(resp.content);
    }
    rl.prompt();
  }
}

rl.setPrompt(`${magenta}>${reset} `);
rl.prompt();
main();
