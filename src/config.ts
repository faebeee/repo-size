import { promises as fs } from "node:fs";
import path from "node:path";
import { CONFIG_FILE, DATA_DIR, type Config } from "./types.js";

export function dataDir(cwd: string = process.cwd()): string {
  return path.join(cwd, DATA_DIR);
}

function configPath(cwd: string = process.cwd()): string {
  return path.join(dataDir(cwd), CONFIG_FILE);
}

async function ensureDataDir(cwd: string = process.cwd()): Promise<void> {
  await fs.mkdir(dataDir(cwd), { recursive: true });
  await ensureGitignoreEntry(cwd);
}

async function ensureGitignoreEntry(cwd: string): Promise<void> {
  const gitignorePath = path.join(cwd, ".gitignore");
  const entry = `${DATA_DIR}/`;
  try {
    const content = await fs.readFile(gitignorePath, "utf8");
    const lines = content.split(/\r?\n/);
    if (lines.some((line) => line.trim() === entry || line.trim() === DATA_DIR)) {
      return;
    }
    const needsNewline = content.length > 0 && !content.endsWith("\n");
    await fs.appendFile(gitignorePath, `${needsNewline ? "\n" : ""}${entry}\n`);
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      // No .gitignore in cwd; don't create one unexpectedly, just skip.
      return;
    }
    throw err;
  }
}

export async function loadConfig(cwd: string = process.cwd()): Promise<Config> {
  try {
    const raw = await fs.readFile(configPath(cwd), "utf8");
    const parsed = JSON.parse(raw);
    return { folders: Array.isArray(parsed.folders) ? parsed.folders : [] };
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return { folders: [] };
    }
    throw err;
  }
}

export async function saveConfig(config: Config, cwd: string = process.cwd()): Promise<void> {
  await ensureDataDir(cwd);
  await fs.writeFile(configPath(cwd), JSON.stringify(config, null, 2) + "\n", "utf8");
}

export function normalizeFolder(folder: string, cwd: string = process.cwd()): string {
  const abs = path.resolve(cwd, folder);
  const rel = path.relative(cwd, abs);
  return rel === "" ? "." : rel;
}
