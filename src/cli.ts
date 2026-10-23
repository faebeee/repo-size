#!/usr/bin/env node
import React from "react";
import { Command } from "commander";
import { render } from "ink";
import { loadConfig, normalizeFolder, saveConfig } from "./config.js";
import { appendSnapshot, loadHistory, saveHistory } from "./history.js";
import { scanFolders } from "./scanner.js";
import { App } from "./tui/App.js";

const program = new Command();

program
  .name("repo-size")
  .description("Scan folders and track file count / lines-of-code trends over time")
  .version("0.1.0");

program
  .command("add")
  .description("Add one or more folders to track")
  .argument("<paths...>", "folder paths to track")
  .action(async (paths: string[]) => {
    const config = await loadConfig();
    const normalized = paths.map((p) => normalizeFolder(p));
    const merged = Array.from(new Set([...config.folders, ...normalized]));
    await saveConfig({ folders: merged });
    console.log(`Tracking ${normalized.length} folder(s). Total tracked: ${merged.length}.`);
    for (const f of normalized) {
      console.log(`  + ${f}`);
    }
  });

program
  .command("remove")
  .description("Remove one or more folders from tracking")
  .argument("<paths...>", "folder paths to stop tracking")
  .action(async (paths: string[]) => {
    const config = await loadConfig();
    const normalized = new Set(paths.map((p) => normalizeFolder(p)));
    const remaining = config.folders.filter((f) => !normalized.has(f));
    await saveConfig({ folders: remaining });
    console.log(`Removed ${config.folders.length - remaining.length} folder(s).`);
  });

program
  .command("list")
  .description("List tracked folders")
  .action(async () => {
    const config = await loadConfig();
    if (config.folders.length === 0) {
      console.log("No folders tracked yet. Use `repo-size add <path>`.");
      return;
    }
    for (const f of config.folders) {
      console.log(f);
    }
  });

program
  .command("scan")
  .description("Scan tracked (and/or given) folders, recording a snapshot")
  .argument("[paths...]", "additional folder paths to scan")
  .option("--save", "persist any given paths to the tracked folder list")
  .action(async (paths: string[], options: { save?: boolean }) => {
    const config = await loadConfig();
    const extra = paths.map((p) => normalizeFolder(p));
    const allFolders = Array.from(new Set([...config.folders, ...extra]));

    if (allFolders.length === 0) {
      console.log("No folders to scan. Use `repo-size add <path>` or pass paths directly.");
      return;
    }

    if (options.save && extra.length > 0) {
      await saveConfig({ folders: allFolders });
    }

    const { results, missing } = await scanFolders(allFolders);
    let history = await loadHistory();
    const timestamp = new Date().toISOString();

    for (const r of results) {
      history = appendSnapshot(history, r.folder, { timestamp, files: r.files, lines: r.lines });
    }
    await saveHistory(history);

    console.log(`\nScan results (${new Date(timestamp).toLocaleString()}):`);
    console.log("-".repeat(50));
    for (const r of results) {
      console.log(`${r.folder.padEnd(30)} files: ${String(r.files).padStart(6)}  lines: ${String(r.lines).padStart(8)}`);
    }
    if (missing.length > 0) {
      console.log("\nSkipped (not found):");
      for (const m of missing) {
        console.log(`  ${m}`);
      }
    }
  });

program
  .command("tui")
  .description("Launch the interactive dashboard")
  .action(() => {
    render(React.createElement(App));
  });

program.action(() => {
  render(React.createElement(App));
});

program.parseAsync(process.argv);
