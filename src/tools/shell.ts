import { FunctionTool } from "../tool";
import * as z from "zod";
import { exec } from "child_process";

type Result = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

function runCommand(command: string): Promise<Result> {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        exitCode: error?.code ?? 0,
      });
    });
  });
}

export const runShell = new FunctionTool({
  name: "runShell",
  description: "Executes a shell command and return its output",
  schema: z.object({
    command: z.string().describe("shell command to execute")
  }),
  callable: async (params: { command: string }) => {
    const ret = await runCommand(params.command)
    return ret;
  }
});
