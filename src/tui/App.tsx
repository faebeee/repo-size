import React, { useCallback, useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { loadConfig } from "../config.js";
import { appendSnapshot, loadHistory, saveHistory } from "../history.js";
import { scanFolders } from "../scanner.js";
import type { History } from "../types.js";
import { FolderList } from "./FolderList.js";
import { TrendView } from "./TrendView.js";

type Metric = "files" | "lines";

export function App() {
  const { exit } = useApp();
  const [folders, setFolders] = useState<string[]>([]);
  const [history, setHistory] = useState<History>({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [metric, setMetric] = useState<Metric>("lines");
  const [status, setStatus] = useState<string>("Loading...");
  const [scanning, setScanning] = useState(false);

  const refresh = useCallback(async () => {
    const config = await loadConfig();
    const hist = await loadHistory();
    setFolders(config.folders);
    setHistory(hist);
    setSelectedIndex((idx) => Math.min(idx, Math.max(config.folders.length - 1, 0)));
    setStatus(
      config.folders.length === 0
        ? 'No folders tracked. Run "repo-size add <path>" then "repo-size scan".'
        : "Ready.",
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rescan = useCallback(async () => {
    if (folders.length === 0) {
      setStatus("No folders to scan.");
      return;
    }
    setScanning(true);
    setStatus("Scanning...");
    try {
      const { results, missing } = await scanFolders(folders);
      let hist = await loadHistory();
      const timestamp = new Date().toISOString();
      for (const r of results) {
        hist = appendSnapshot(hist, r.folder, { timestamp, files: r.files, lines: r.lines });
      }
      await saveHistory(hist);
      setHistory(hist);
      setStatus(
        missing.length > 0
          ? `Scanned ${results.length} folder(s). Missing: ${missing.join(", ")}`
          : `Scanned ${results.length} folder(s) at ${new Date(timestamp).toLocaleTimeString()}.`,
      );
    } catch (err: any) {
      setStatus(`Scan failed: ${err?.message ?? String(err)}`);
    } finally {
      setScanning(false);
    }
  }, [folders]);

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
      return;
    }
    if (key.upArrow || input === "k") {
      setSelectedIndex((idx) => Math.max(idx - 1, 0));
      return;
    }
    if (key.downArrow || input === "j") {
      setSelectedIndex((idx) => Math.min(idx + 1, folders.length - 1));
      return;
    }
    if (input === "r" && !scanning) {
      rescan();
      return;
    }
    if (key.tab) {
      setMetric((m) => (m === "lines" ? "files" : "lines"));
      return;
    }
  });

  const selectedFolder = folders[selectedIndex] ?? null;
  const selectedSnapshots = selectedFolder ? history[selectedFolder] ?? [] : [];

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyanBright">
          repo-size
        </Text>
        <Text dimColor> — folder size trends</Text>
      </Box>
      <Box>
        <FolderList folders={folders} history={history} selectedIndex={selectedIndex} />
        <Box marginLeft={1} flexGrow={1}>
          <TrendView folder={selectedFolder} snapshots={selectedSnapshots} metric={metric} />
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          ↑/↓ or j/k select · r rescan · tab toggle metric ({metric}) · q quit
        </Text>
      </Box>
      <Box>
        <Text color={scanning ? "yellow" : "gray"}>{status}</Text>
      </Box>
    </Box>
  );
}
