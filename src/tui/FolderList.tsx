import React from "react";
import { Box, Text } from "ink";
import type { History } from "../types.js";
import { renderSparkline } from "./Sparkline.js";

interface FolderListProps {
  folders: string[];
  history: History;
  selectedIndex: number;
}

function formatDelta(delta: number): { text: string; color: string } {
  if (delta > 0) return { text: `+${delta}`, color: "green" };
  if (delta < 0) return { text: `${delta}`, color: "red" };
  return { text: "±0", color: "gray" };
}

export function FolderList({ folders, history, selectedIndex }: FolderListProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} width={56}>
      <Text bold color="cyan">
        Tracked folders
      </Text>
      {folders.length === 0 && <Text dimColor>No folders tracked yet. Run "repo-size add &lt;path&gt;".</Text>}
      {folders.map((folder, idx) => {
        const snaps = history[folder] ?? [];
        const last = snaps[snaps.length - 1];
        const prev = snaps[snaps.length - 2];
        const isSelected = idx === selectedIndex;
        const lineDelta = last && prev ? formatDelta(last.lines - prev.lines) : null;
        const sparkValues = snaps.slice(-20).map((s) => s.lines);

        return (
          <Box key={folder} flexDirection="column" marginTop={1}>
            <Text color={isSelected ? "black" : "white"} backgroundColor={isSelected ? "cyan" : undefined}>
              {isSelected ? "➤ " : "  "}
              {folder}
            </Text>
            {last ? (
              <Box marginLeft={2} flexDirection="column">
                <Text>
                  files: <Text bold>{last.files}</Text>
                  {"  "}lines: <Text bold>{last.lines}</Text>
                  {lineDelta && <Text color={lineDelta.color}> ({lineDelta.text})</Text>}
                </Text>
                {sparkValues.length > 1 && (
                  <Text color="magenta">{renderSparkline(sparkValues)}</Text>
                )}
              </Box>
            ) : (
              <Box marginLeft={2}>
                <Text dimColor>no scans yet</Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
