/**
 * Configuration for frame analysis
 */
export interface FrameAnalyzerConfig {
  /** X offset for the sampling window */
  offsetX: number;
  /** Y offset for the sampling window */
  offsetY: number;
  /** Width of the sampling window */
  windowWidth: number;
  /** Height of the sampling window */
  windowHeight: number;
  /** Number of rows in the output matrix */
  rows: number;
  /** Number of columns in the output matrix */
  columns: number;
  /** Brightness threshold (0-255), default 128 */
  threshold?: number;
}

/**
 * Result of frame analysis
 */
export interface FrameAnalysisResult {
  /** 2D boolean matrix where true = bright, false = dark */
  matrix: boolean[][];
  /** Configuration used for this analysis */
  config: FrameAnalyzerConfig;
  /** Analysis timestamp */
  timestamp: number;
}