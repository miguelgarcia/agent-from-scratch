// Importing necessary modules and types
import { FunctionTool } from "../tool"; // Importing FunctionTool to create a callable tool
import * as z from "zod"; // Importing zod for schema validation
import { exec } from "child_process"; // Importing exec to run shell commands

// Defining the structure of the result returned by the command execution
type Result = {
  stdout: string; // Standard output from the command
  stderr: string; // Standard error output from the command
  exitCode: number; // Exit code of the command
};

// Function to run a shell command and return its output
function runCommand(command: string): Promise<Result> {
  return new Promise((resolve) => {
    // Executing the command using exec
    exec(command, (error, stdout, stderr) => {
      // Resolving the promise with the command's output and exit code
      resolve({
        stdout,
        stderr,
        exitCode: error?.code ?? 0, // If there's an error, return its code; otherwise, return 0
      });
    });
  });
}

// Creating a new FunctionTool instance for running shell commands
export const runShell = new FunctionTool({
  name: "runShell", // Name of the tool
  description: "Executes a shell command and return its output", // Description of what the tool does
  schema: z.object({ // Defining the input schema using zod
    command: z.string().describe("shell command to execute") // The command to be executed
  }),
  callable: async (params: { command: string }) => { // The function to call when the tool is used
    const ret = await runCommand(params.command); // Running the command and awaiting the result
    return ret; // Returning the result
  }
});
