import { FunctionTool } from "../tool";
import * as z from "zod";
import * as fs from "fs";

const diffSchema = z.object({
  file: z.string().describe("path to the file to edit"),
  startLine: z.number().describe("1-based first line to replace (inclusive)"),
  endLine: z.number().describe("1-based last line to replace (inclusive)"),
  newContent: z.string().describe("replacement text (empty string to delete lines)"),
});

type Diff = z.infer<typeof diffSchema>;
type FileResult = { file: string; applied: number; errors: string[] };

function applyToFile(filePath: string, diffs: Diff[]): FileResult {
  const errors: string[] = [];
  let lines = fs.readFileSync(filePath, "utf8").split("\n");

  // Sort descending by startLine so each splice doesn't shift subsequent diffs
  const sorted = [...diffs].sort((a, b) => b.startLine - a.startLine);

  // Validate: out of bounds and overlaps
  for (const diff of sorted) {
    if (diff.startLine < 1 || diff.endLine > lines.length || diff.startLine > diff.endLine) {
      errors.push(`Lines ${diff.startLine}-${diff.endLine} out of bounds (file has ${lines.length} lines)`);
    }
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if (curr && next && curr.startLine <= next.endLine) {
      errors.push(`Diffs overlap: [${next.startLine}-${next.endLine}] and [${curr.startLine}-${curr.endLine}]`);
    }
  }

  if (errors.length > 0) {
    return { file: filePath, applied: 0, errors };
  }

  for (const diff of sorted) {
    const replacement = diff.newContent === "" ? [] : diff.newContent.split("\n");
    lines.splice(diff.startLine - 1, diff.endLine - diff.startLine + 1, ...replacement);
  }

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  return { file: filePath, applied: sorted.length, errors: [] };
}

export const applyDiffs = new FunctionTool({
  name: "applyDiffs",
  description: "Apply line-range replacements to one or more files. Multiple diffs per file are applied last-line-first to preserve line numbers.",
  schema: z.object({
    diffs: z.array(diffSchema).describe("list of line-range replacements to apply"),
  }),
  callable: ({ diffs }) => {
    const byFile = new Map<string, Diff[]>();
    for (const diff of diffs) {
      const list = byFile.get(diff.file) ?? [];
      list.push(diff);
      byFile.set(diff.file, list);
    }
    const results: FileResult[] = [];
    for (const [file, fileDiffs] of byFile) {
      results.push(applyToFile(file, fileDiffs));
    }
    return results;
  },
});
