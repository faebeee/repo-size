declare module "asciichart" {
  interface PlotOptions {
    height?: number;
    min?: number;
    max?: number;
    offset?: number;
    padding?: string;
    colors?: unknown[];
  }

  const asciichart: {
    plot(series: number[] | number[][], options?: PlotOptions): string;
    [key: string]: unknown;
  };

  export default asciichart;
}
