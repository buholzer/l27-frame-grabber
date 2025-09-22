// Setup Canvas API for tests
import { vi } from 'vitest';

// Mock ImageData constructor for Node.js environment
global.ImageData = class ImageData {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height || data.length / (width * 4);
  }
};

// Mock Canvas APIs if needed
global.HTMLCanvasElement = class HTMLCanvasElement {
  constructor() {
    this.width = 0;
    this.height = 0;
  }

  getContext() {
    return {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => new ImageData(new Uint8ClampedArray(4), 1, 1))
    };
  }
};