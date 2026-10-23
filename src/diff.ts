import type { Snapshot, SnapshotDiff } from "./types.js";

export function computeDiff(from: Snapshot, to: Snapshot): SnapshotDiff {
  return {
    filesDelta: to.files - from.files,
    linesDelta: to.lines - from.lines,
  };
}

export function formatDeltaText(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return "±0";
}

export function formatDeltaColor(delta: number): string {
  if (delta > 0) return "green";
  if (delta < 0) return "red";
  return "gray";
}
