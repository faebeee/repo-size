export interface Snapshot {
  timestamp: string;
  files: number;
  lines: number;
}

export interface Config {
  folders: string[];
}

export interface History {
  [folder: string]: Snapshot[];
}

export interface FolderStats {
  folder: string;
  files: number;
  lines: number;
}

export interface SnapshotDiff {
  filesDelta: number;
  linesDelta: number;
}

export const MAX_HISTORY_ENTRIES = 200;
export const DATA_DIR = ".repo-size";
export const CONFIG_FILE = "config.json";
export const HISTORY_FILE = "history.json";
