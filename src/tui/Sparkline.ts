const BLOCKS = "▁▂▃▄▅▆▇█";

export function renderSparkline(values: number[]): string {
  if (values.length === 0) {
    return "";
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) {
    return BLOCKS[0].repeat(values.length);
  }
  return values
    .map((v) => {
      const idx = Math.round(((v - min) / range) * (BLOCKS.length - 1));
      return BLOCKS[idx];
    })
    .join("");
}
