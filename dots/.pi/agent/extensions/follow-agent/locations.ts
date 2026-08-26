import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

export interface FollowLocation {
  path: string;
  line: number;
  endLine: number;
}

interface EditInput {
  path?: unknown;
  edits?: unknown;
  oldText?: unknown;
  newText?: unknown;
}

interface WriteInput {
  path?: unknown;
  content?: unknown;
}

/**
 * Resolves the first location affected by a built-in mutation tool.
 */
export async function resolveLocation(
  toolName: string,
  args: unknown,
  cwd: string,
): Promise<FollowLocation | undefined> {
  if (!isRecord(args)) return undefined;

  if (toolName === "write") {
    const input = args as WriteInput;
    if (typeof input.path !== "string") return undefined;
    const lineCount = typeof input.content === "string" ? countLines(input.content) : 1;
    return { path: absolutePath(input.path, cwd), line: 1, endLine: lineCount };
  }

  if (toolName !== "edit") return undefined;

  const input = args as EditInput;
  if (typeof input.path !== "string") return undefined;

  const path = absolutePath(input.path, cwd);
  const edit = firstEdit(input);
  const changedLineCount = edit?.newText === undefined ? 1 : countLines(edit.newText);
  if (!edit?.oldText) return { path, line: 1, endLine: changedLineCount };

  try {
    const contents = await readFile(path, "utf8");
    const index = contents.indexOf(edit.oldText);
    if (index < 0) return { path, line: 1, endLine: changedLineCount };

    const line = contents.slice(0, index).split("\n").length;
    return { path, line, endLine: line + changedLineCount - 1 };
  } catch {
    return { path, line: 1, endLine: changedLineCount };
  }
}

function firstEdit(input: EditInput): { oldText?: string; newText?: string } | undefined {
  if (typeof input.oldText === "string") {
    const newText = typeof input.newText === "string" ? input.newText : undefined;
    return { oldText: input.oldText, newText };
  }

  if (!Array.isArray(input.edits)) return undefined;
  const first = input.edits[0];
  if (!isRecord(first)) return undefined;

  return {
    oldText: typeof first.oldText === "string" ? first.oldText : undefined,
    newText: typeof first.newText === "string" ? first.newText : undefined,
  };
}

function countLines(text: string): number {
  return Math.max(1, text.split("\n").length);
}

function absolutePath(path: string, cwd: string): string {
  return isAbsolute(path) ? path : resolve(cwd, path);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
