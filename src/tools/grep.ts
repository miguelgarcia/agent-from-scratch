import { FunctionTool } from "../tool";
import * as z from "zod";
import { exec } from "child_process";

type Match = { file: string; line: number; text: string };

function runGrep(pattern: string, path: string, recursive: boolean): Promise<Match[]> {
  return new Promise((resolve) => {
    const flags = recursive ? "-rn" : "-n";
    exec(`grep ${flags} -E ${JSON.stringify(pattern)} ${JSON.stringify(path)}`, (_err, stdout) => {
      if (!stdout.trim()) {
        resolve([]);
        return;
      }
      const matches: Match[] = [];
      for (const raw of stdout.trim().split("\n")) {
        // recursive output: "file:lineNum:text", single-file output: "lineNum:text"
        const recMatch = raw.match(/^(.+?):(\d+):(.*)$/);
        if (recMatch && recMatch[1] && recMatch[2] && recMatch[3] !== undefined) {
          matches.push({ file: recMatch[1], line: parseInt(recMatch[2], 10), text: recMatch[3] });
        }
      }
      resolve(matches);
    });
  });
}

export const grep = new FunctionTool({
  name: "grep",
  description: "Search for a regex pattern in a file or directory. Returns matching lines with file and line number.",
  schema: z.object({
    pattern: z.string().describe("regex pattern to search for"),
    path: z.string().describe("file or directory to search"),
    recursive: z.boolean().optional().describe("recurse into directories (default: true)"),
  }),
  callable: async ({ pattern, path, recursive = true }) => {
    return runGrep(pattern, path, recursive);
  },
});
