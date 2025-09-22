# Frame Analyzer

A TypeScript library for real-time pixel-to-boolean matrix extraction from video frames. Designed to work in both browser and Node.js environments with high performance and easy integration.

## Features

- 🎥 **Real-time analysis** of video frames
- 🧮 **Boolean matrix extraction** based on brightness thresholds
- 🌐 **Cross-platform** support (Browser and Node.js)
- ⚡ **High performance** with OffscreenCanvas and Web Worker support
- 🎛️ **Configurable parameters** for flexible analysis
- 📱 **Interactive demo** with live camera feed
- 🧪 **Comprehensive testing** with TypeScript support

## Quick Start

### Installation

```bash
npm install frame-analyzer
```

### Basic Usage

```typescript
import { analyzeFrame, createDefaultConfig } from 'frame-analyzer';

// Get ImageData from canvas or video frame
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
ctx.drawImage(video, 0, 0);
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Create configuration
const config = createDefaultConfig(canvas.width, canvas.height);

// Analyze frame
const result = analyzeFrame(imageData, config);
console.log(result.matrix); // 2D boolean array
```

### Browser Integration

```typescript
import { CameraManager, FrameProcessor } from 'frame-analyzer/browser';

const cameraManager = new CameraManager();
const frameProcessor = new FrameProcessor();

// Start camera
const stream = await cameraManager.requestCamera();
const video = cameraManager.createVideoElement();
await cameraManager.waitForVideoReady();

// Process frames
frameProcessor.start(video, config, (result) => {
  console.log('Boolean matrix:', result.matrix);
  console.log('Timestamp:', result.timestamp);
});
```

## API Reference

### Core Functions

#### `analyzeFrame(imageData: ImageData, config: FrameAnalyzerConfig): FrameAnalysisResult`

Analyzes a video frame and extracts a boolean matrix based on brightness.

**Parameters:**
- `imageData` - Image data from canvas or video frame
- `config` - Configuration object with analysis parameters

**Returns:** Analysis result with boolean matrix and metadata

#### `createDefaultConfig(width: number, height: number): FrameAnalyzerConfig`

Creates a default configuration for the specified image dimensions.

### Configuration

```typescript
interface FrameAnalyzerConfig {
  offsetX: number;        // X offset for sampling window
  offsetY: number;        // Y offset for sampling window
  windowWidth: number;    // Width of sampling window
  windowHeight: number;   // Height of sampling window
  rows: number;          // Number of rows in output matrix
  columns: number;       // Number of columns in output matrix
  threshold?: number;    // Brightness threshold (0-255, default: 128)
}
```

### Browser Classes

#### `CameraManager`

Handles camera access and video element management.

```typescript
const manager = new CameraManager();
await manager.requestCamera({ facingMode: 'environment' });
const video = manager.createVideoElement();
```

#### `FrameProcessor`

Processes video frames in real-time using standard Canvas API.

```typescript
const processor = new FrameProcessor(canvas);
processor.start(video, config, callback);
```

#### `OffscreenFrameProcessor`

High-performance processor using OffscreenCanvas (when supported).

```typescript
if (OffscreenFrameProcessor.isSupported()) {
  const processor = new OffscreenFrameProcessor(canvas);
  processor.start(video, config, callback);
}
```

## Demo

Run the interactive browser demo:

```bash
npm run demo
```

This opens a web interface where you can:
- Access your camera feed
- Adjust analysis parameters in real-time
- See the boolean matrix visualization
- Monitor performance metrics
- Toggle between regular and OffscreenCanvas processing

## Development

### Build the library

```bash
npm run build
```

### Run tests

```bash
npm test
```

### Development with watch mode

```bash
npm run build:watch
```

## Browser Compatibility

- **Modern browsers** with ES2022 support
- **Camera access** requires HTTPS in production
- **OffscreenCanvas** support varies (Chrome, Firefox, Safari 16.4+)
- **requestVideoFrameCallback** provides optimal performance when available

## Performance Considerations

- Use **OffscreenCanvas** for better performance when available
- Limit matrix size for real-time processing (8x8 to 16x16 recommended)
- Consider reducing video resolution for higher frame rates
- Use **requestVideoFrameCallback** when supported for better sync

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request