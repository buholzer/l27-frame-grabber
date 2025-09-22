import type { FrameAnalyzerConfig, FrameAnalysisResult } from './types.js';

/**
 * Calculate relative luminance for a pixel
 * Uses the standard formula: 0.2126*R + 0.7152*G + 0.0722*B
 */
function calculateBrightness(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Get pixel data at specific coordinates from ImageData
 */
function getPixelAt(imageData: ImageData, x: number, y: number): [number, number, number] {
  const { width, data } = imageData;
  const index = (Math.floor(y) * width + Math.floor(x)) * 4;

  return [
    data[index] ?? 0,     // R
    data[index + 1] ?? 0, // G
    data[index + 2] ?? 0  // B
  ];
}

/**
 * Validate configuration parameters
 */
function validateConfig(config: FrameAnalyzerConfig, imageData: ImageData): void {
  const { offsetX, offsetY, windowWidth, windowHeight, rows, columns } = config;

  if (offsetX < 0 || offsetY < 0) {
    throw new Error('Offset coordinates must be non-negative');
  }

  if (windowWidth <= 0 || windowHeight <= 0) {
    throw new Error('Window dimensions must be positive');
  }

  if (rows <= 0 || columns <= 0) {
    throw new Error('Matrix dimensions must be positive');
  }

  if (offsetX + windowWidth > imageData.width || offsetY + windowHeight > imageData.height) {
    throw new Error('Sampling window exceeds image boundaries');
  }

  if (config.threshold !== undefined && (config.threshold < 0 || config.threshold > 255)) {
    throw new Error('Threshold must be between 0 and 255');
  }
}

/**
 * Analyze a video frame and extract a boolean matrix based on brightness
 *
 * @param imageData - Image data from canvas or video frame
 * @param config - Configuration for the analysis
 * @returns Analysis result with boolean matrix
 */
export function analyzeFrame(imageData: ImageData, config: FrameAnalyzerConfig): FrameAnalysisResult {
  validateConfig(config, imageData);

  const {
    offsetX,
    offsetY,
    windowWidth,
    windowHeight,
    rows,
    columns,
    threshold = 128
  } = config;

  // Calculate cell dimensions
  const cellWidth = windowWidth / columns;
  const cellHeight = windowHeight / rows;

  // Initialize result matrix
  const matrix: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => false)
  );

  // Sample each cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      // Sample center of each cell
      const sampleX = offsetX + (col + 0.5) * cellWidth;
      const sampleY = offsetY + (row + 0.5) * cellHeight;

      // Get pixel color
      const [r, g, b] = getPixelAt(imageData, sampleX, sampleY);

      // Calculate brightness and apply threshold
      const brightness = calculateBrightness(r, g, b);
      matrix[row]![col] = brightness >= threshold;
    }
  }

  return {
    matrix,
    config,
    timestamp: Date.now()
  };
}

/**
 * Create a default configuration for frame analysis
 */
export function createDefaultConfig(imageWidth: number, imageHeight: number): FrameAnalyzerConfig {
  return {
    offsetX: 236,
    offsetY: 112,
    windowWidth: 168,
    windowHeight: 224,
    rows: 64,
    columns: 42,
    threshold: 128
  };
}