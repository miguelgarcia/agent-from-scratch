import { FunctionTool } from "../tool";
import * as z from "zod";
import * as fs from "fs";

export const readFile = new FunctionTool({
  name: "readFile",
  description: "Read a file's contents, optionally limited to a line range. Returns content with line numbers.",
  requiresApproval: false,
  schema: z.object({
    path: z.string().describe("path to the file"),
    startLine: z.number().optional().describe("1-based start line (inclusive)"),
    endLine: z.number().optional().describe("1-based end line (inclusive)"),
  }),
  callable: ({ path, startLine, endLine }) => {
    const raw = fs.readFileSync(path, "utf8");
    const lines = raw.split("\n");
    const totalLines = lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
    const from = startLine ? startLine - 1 : 0;
    const to = endLine ? endLine : lines.length;
    const slice = lines.slice(from, to);
    const content = slice
      .map((line, i) => `${String(from + i + 1).padStart(6)}\t${line}`)
      .join("\n");
    return { content, totalLines };
  },
});
