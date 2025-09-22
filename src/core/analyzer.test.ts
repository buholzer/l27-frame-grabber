import { describe, it, expect } from 'vitest';
import { analyzeFrame, createDefaultConfig } from './analyzer.js';
import type { FrameAnalyzerConfig } from './types.js';

// Helper function to create test ImageData
function createTestImageData(width: number, height: number, fillValue = 128): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = fillValue;     // R
    data[i + 1] = fillValue; // G
    data[i + 2] = fillValue; // B
    data[i + 3] = 255;       // A
  }

  return new ImageData(data, width, height);
}

// Helper function to create checkerboard pattern
function createCheckerboardImageData(width: number, height: number, cellSize = 10): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      const isLight = (cellX + cellY) % 2 === 0;
      const value = isLight ? 255 : 0;

      const index = (y * width + x) * 4;
      data[index] = value;     // R
      data[index + 1] = value; // G
      data[index + 2] = value; // B
      data[index + 3] = 255;   // A
    }
  }

  return new ImageData(data, width, height);
}

describe('analyzeFrame', () => {
  it('should analyze a simple uniform image', () => {
    const imageData = createTestImageData(100, 100, 200); // Bright image
    const config: FrameAnalyzerConfig = {
      offsetX: 0,
      offsetY: 0,
      windowWidth: 100,
      windowHeight: 100,
      rows: 4,
      columns: 4,
      threshold: 128
    };

    const result = analyzeFrame(imageData, config);

    expect(result.matrix).toHaveLength(4);
    expect(result.matrix[0]).toHaveLength(4);
    expect(result.config).toEqual(config);
    expect(result.timestamp).toBeTypeOf('number');

    // All cells should be bright (true) since fillValue > threshold
    result.matrix.forEach(row => {
      row.forEach(cell => {
        expect(cell).toBe(true);
      });
    });
  });

  it('should handle dark images correctly', () => {
    const imageData = createTestImageData(100, 100, 50); // Dark image
    const config: FrameAnalyzerConfig = {
      offsetX: 0,
      offsetY: 0,
      windowWidth: 100,
      windowHeight: 100,
      rows: 2,
      columns: 2,
      threshold: 128
    };

    const result = analyzeFrame(imageData, config);

    // All cells should be dark (false) since fillValue < threshold
    result.matrix.forEach(row => {
      row.forEach(cell => {
        expect(cell).toBe(false);
      });
    });
  });

  it('should work with custom threshold', () => {
    const imageData = createTestImageData(100, 100, 100);
    const config: FrameAnalyzerConfig = {
      offsetX: 0,
      offsetY: 0,
      windowWidth: 100,
      windowHeight: 100,
      rows: 2,
      columns: 2,
      threshold: 50 // Lower threshold
    };

    const result = analyzeFrame(imageData, config);

    // All cells should be bright since fillValue (100) > threshold (50)
    result.matrix.forEach(row => {
      row.forEach(cell => {
        expect(cell).toBe(true);
      });
    });
  });

  it('should handle window offset correctly', () => {
    const imageData = createCheckerboardImageData(100, 100, 25); // 4x4 checkerboard
    const config: FrameAnalyzerConfig = {
      offsetX: 25,
      offsetY: 25,
      windowWidth: 50,
      windowHeight: 50,
      rows: 2,
      columns: 2,
      threshold: 128
    };

    const result = analyzeFrame(imageData, config);

    expect(result.matrix).toHaveLength(2);
    expect(result.matrix[0]).toHaveLength(2);

    // Should sample from different quadrants of the checkerboard
    expect(result.matrix).toEqual([
      [true, false],
      [false, true]
    ]);
  });

  it('should validate configuration parameters', () => {
    const imageData = createTestImageData(100, 100);

    // Test negative offset
    expect(() => {
      analyzeFrame(imageData, {
        offsetX: -1,
        offsetY: 0,
        windowWidth: 50,
        windowHeight: 50,
        rows: 2,
        columns: 2
      });
    }).toThrow('Offset coordinates must be non-negative');

    // Test zero dimensions
    expect(() => {
      analyzeFrame(imageData, {
        offsetX: 0,
        offsetY: 0,
        windowWidth: 0,
        windowHeight: 50,
        rows: 2,
        columns: 2
      });
    }).toThrow('Window dimensions must be positive');

    // Test zero matrix dimensions
    expect(() => {
      analyzeFrame(imageData, {
        offsetX: 0,
        offsetY: 0,
        windowWidth: 50,
        windowHeight: 50,
        rows: 0,
        columns: 2
      });
    }).toThrow('Matrix dimensions must be positive');

    // Test window exceeding image bounds
    expect(() => {
      analyzeFrame(imageData, {
        offsetX: 50,
        offsetY: 50,
        windowWidth: 100,
        windowHeight: 100,
        rows: 2,
        columns: 2
      });
    }).toThrow('Sampling window exceeds image boundaries');

    // Test invalid threshold
    expect(() => {
      analyzeFrame(imageData, {
        offsetX: 0,
        offsetY: 0,
        windowWidth: 50,
        windowHeight: 50,
        rows: 2,
        columns: 2,
        threshold: 300
      });
    }).toThrow('Threshold must be between 0 and 255');
  });

  it('should handle different matrix sizes', () => {
    const imageData = createTestImageData(100, 100, 200);

    // Test 1x1 matrix
    const config1x1: FrameAnalyzerConfig = {
      offsetX: 0,
      offsetY: 0,
      windowWidth: 100,
      windowHeight: 100,
      rows: 1,
      columns: 1,
      threshold: 128
    };

    const result1x1 = analyzeFrame(imageData, config1x1);
    expect(result1x1.matrix).toHaveLength(1);
    expect(result1x1.matrix[0]).toHaveLength(1);

    // Test large matrix
    const configLarge: FrameAnalyzerConfig = {
      offsetX: 0,
      offsetY: 0,
      windowWidth: 100,
      windowHeight: 100,
      rows: 10,
      columns: 10,
      threshold: 128
    };

    const resultLarge = analyzeFrame(imageData, configLarge);
    expect(resultLarge.matrix).toHaveLength(10);
    expect(resultLarge.matrix[0]).toHaveLength(10);
  });
});

describe('createDefaultConfig', () => {
  it('should create a valid default configuration', () => {
    const config = createDefaultConfig(640, 480);

    expect(config).toEqual({
      offsetX: 0,
      offsetY: 0,
      windowWidth: 640,
      windowHeight: 480,
      rows: 8,
      columns: 8,
      threshold: 128
    });
  });

  it('should handle different image dimensions', () => {
    const config = createDefaultConfig(1920, 1080);

    expect(config.windowWidth).toBe(1920);
    expect(config.windowHeight).toBe(1080);
    expect(config.offsetX).toBe(0);
    expect(config.offsetY).toBe(0);
  });
});