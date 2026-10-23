import { promises as fs } from "node:fs";
import path from "node:path";
import type { Ignore } from "ignore";
import { buildIgnoreMatcher, isIgnored } from "./gitignore.js";
import type { FolderStats } from "./types.js";

const BINARY_SNIFF_BYTES = 8000;

async function isBinaryFile(filePath: string): Promise<boolean> {
  let handle: fs.FileHandle | undefined;
  try {
    handle = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(BINARY_SNIFF_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, BINARY_SNIFF_BYTES, 0);
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  } catch {
    return true; // unreadable -> treat as binary/skip LOC counting
  } finally {
    await handle?.close();
  }
}

function countLines(content: string): number {
  if (content.length === 0) {
    return 0;
  }
  const trimmed = content.endsWith("\n") ? content.slice(0, -1) : content;
  if (trimmed.length === 0) {
    return 1;
  }
  return trimmed.split("\n").length;
}

async function walk(
  dir: string,
  cwd: string,
  ig: Ignore,
  stats: { files: number; lines: number },
): Promise<void> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relFromCwd = path.relative(cwd, fullPath).split(path.sep).join("/");

    if (entry.isDirectory()) {
      if (isIgnored(ig, relFromCwd + "/")) {
        continue;
      }
      await walk(fullPath, cwd, ig, stats);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (isIgnored(ig, relFromCwd)) {
      continue;
    }

    stats.files += 1;

    const binary = await isBinaryFile(fullPath);
    if (binary) {
      continue;
    }

    try {
      const content = await fs.readFile(fullPath, "utf8");
      stats.lines += countLines(content);
    } catch {
      // skip unreadable files for LOC purposes
    }
  }
}

export async function scanFolder(
  folder: string,
  cwd: string = process.cwd(),
  ig?: Ignore,
): Promise<FolderStats> {
  const matcher = ig ?? (await buildIgnoreMatcher(cwd));
  const absFolder = path.resolve(cwd, folder);
  const stats = { files: 0, lines: 0 };
  await walk(absFolder, cwd, matcher, stats);
  return { folder, files: stats.files, lines: stats.lines };
}

export async function scanFolders(
  folders: string[],
  cwd: string = process.cwd(),
): Promise<{ results: FolderStats[]; missing: string[] }> {
  const ig = await buildIgnoreMatcher(cwd);
  const results: FolderStats[] = [];
  const missing: string[] = [];

  for (const folder of folders) {
    const absFolder = path.resolve(cwd, folder);
    try {
      const st = await fs.stat(absFolder);
      if (!st.isDirectory()) {
        missing.push(folder);
        continue;
      }
    } catch {
      missing.push(folder);
      continue;
    }
    results.push(await scanFolder(folder, cwd, ig));
  }

  return { results, missing };
}
