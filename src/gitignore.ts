import { promises as fs } from "node:fs";
import path from "node:path";
import ignore, { type Ignore } from "ignore";
import { DATA_DIR } from "./types.js";

export async function buildIgnoreMatcher(cwd: string = process.cwd()): Promise<Ignore> {
  const ig = ignore();
  ig.add([".git", DATA_DIR]);
  try {
    const content = await fs.readFile(path.join(cwd, ".gitignore"), "utf8");
    ig.add(content);
  } catch (err: any) {
    if (err?.code !== "ENOENT") {
      throw err;
    }
  }
  return ig;
}

/**
 * Returns true if the given path (relative to cwd, posix separators) is ignored.
 */
export function isIgnored(ig: Ignore, relPathFromCwd: string): boolean {
  if (relPathFromCwd === "" || relPathFromCwd === ".") {
    return false;
  }
  return ig.ignores(relPathFromCwd);
}
