/**
 * Main entry point. Takes care of terminal handling and delegates actual work on Agent.
 */
import readline from 'readline';
import { HumanMessage } from './messages';
import { Agent } from './agent';
import { FunctionTool } from './tool';
import * as z from "zod";
const magenta = "\x1b[35m";
const reset = "\x1b[0m";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const weatherTool = new FunctionTool({
    name: "getWeather",
    description: "Returns the current weather in the specified city",
    schema: z.object({
      city: z.string().describe("city code")
    }),
    callable: ({ city }) => {
      console.log(`Fake weather for ${city}`);
      return { temperature: 15.5, humidity: 88.5 };
    }
  })
  const agent = new Agent({ tools: [weatherTool] });
  for await (const line of rl) {
    const input = line.trim();
    if (input === "/exit") {
      console.log("Hasta la vista!");
      process.exit(0);
    }
    for await (const resp of agent.invoke(new HumanMessage(input))) {
      console.log(resp.content);
      if (resp.type == "ai") {
        console.log(resp.toolCalls);
      }
    }
    rl.prompt();
  }
}

rl.setPrompt(`${magenta}>${reset} `);
rl.prompt();
main();
