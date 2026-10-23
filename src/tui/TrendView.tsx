import React from "react";
import { Box, Text } from "ink";
import asciichart from "asciichart";
import type { Snapshot } from "../types.js";

interface TrendViewProps {
  folder: string | null;
  snapshots: Snapshot[];
  metric: "files" | "lines";
}

export function TrendView({ folder, snapshots, metric }: TrendViewProps) {
  if (!folder) {
    return (
      <Box borderStyle="round" borderColor="gray" paddingX={1} flexGrow={1}>
        <Text dimColor>Select a folder to see its trend.</Text>
      </Box>
    );
  }

  const values = snapshots.map((s) => s[metric]);
  const hasEnoughData = values.length >= 2;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} flexGrow={1}>
      <Text bold color="green">
        {folder} — {metric} over time
      </Text>
      {hasEnoughData ? (
        <Text>{asciichart.plot(values, { height: 12 })}</Text>
      ) : (
        <Box marginTop={1}>
          <Text dimColor>Not enough scans yet to plot a trend (need at least 2).</Text>
        </Box>
      )}
      {snapshots.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>
            Last scan: {new Date(snapshots[snapshots.length - 1].timestamp).toLocaleString()}
          </Text>
          <Text dimColor>Total scans recorded: {snapshots.length}</Text>
        </Box>
      )}
    </Box>
  );
}
