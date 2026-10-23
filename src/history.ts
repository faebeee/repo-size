import { promises as fs } from "node:fs";
import path from "node:path";
import { dataDir } from "./config.js";
import { HISTORY_FILE, MAX_HISTORY_ENTRIES, type History, type Snapshot } from "./types.js";

function historyPath(cwd: string = process.cwd()): string {
  return path.join(dataDir(cwd), HISTORY_FILE);
}

export async function loadHistory(cwd: string = process.cwd()): Promise<History> {
  try {
    const raw = await fs.readFile(historyPath(cwd), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as History) : {};
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return {};
    }
    throw err;
  }
}

export async function saveHistory(history: History, cwd: string = process.cwd()): Promise<void> {
  await fs.mkdir(dataDir(cwd), { recursive: true });
  await fs.writeFile(historyPath(cwd), JSON.stringify(history, null, 2) + "\n", "utf8");
}

export function appendSnapshot(history: History, folder: string, snapshot: Snapshot): History {
  const existing = history[folder] ?? [];
  const updated = [...existing, snapshot];
  const trimmed =
    updated.length > MAX_HISTORY_ENTRIES
      ? updated.slice(updated.length - MAX_HISTORY_ENTRIES)
      : updated;
  return { ...history, [folder]: trimmed };
}
