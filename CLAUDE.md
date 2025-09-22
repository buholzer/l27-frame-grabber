# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Frame Analyzer is a TypeScript library for real-time pixel-to-boolean matrix extraction from video frames. It works in both browser and Node.js environments, with focus on high performance and easy integration.

## Build Commands

- `npm run build` - Build the TypeScript library
- `npm run build:watch` - Build in watch mode for development
- `npm test` - Run the test suite with Vitest
- `npm run demo` - Start the browser demo with Vite dev server
- `npm run lint` - Run ESLint on TypeScript files
- `npm run clean` - Remove build artifacts

## Architecture

### Core Structure
- **`src/core/`** - Platform-agnostic transformation logic
  - `analyzer.ts` - Main frame analysis function with brightness calculation
  - `types.ts` - TypeScript interfaces and type definitions
- **`src/browser/`** - Browser-specific implementations
  - `camera.ts` - Camera access and video element management
  - `frame-processor.ts` - Real-time frame processing with requestVideoFrameCallback
- **`demo/browser/`** - Interactive web demo with live controls

### Key Design Patterns
- **ESM-only** build target for modern JavaScript environments
- **Dual exports** in package.json for core and browser-specific modules
- **Performance optimization** with OffscreenCanvas support when available
- **Real-time processing** using requestVideoFrameCallback with requestAnimationFrame fallback

### Core Algorithm
Frame analysis uses relative luminance formula (`0.2126×R + 0.7152×G + 0.0722×B`) to calculate brightness, then applies configurable threshold (default 128) to generate boolean matrix where each cell represents a grid subdivision of the input frame.

## Testing

Uses Vitest with jsdom environment for testing core transformation logic. Tests cover:
- Basic frame analysis functionality
- Configuration validation
- Edge cases and error handling
- Different matrix sizes and thresholds

## Development Notes

- TypeScript with strict mode enabled
- Canvas API used for both browser video processing and image data manipulation
- Camera requires HTTPS in production environments
- OffscreenCanvas provides performance benefits when supported
- Frame processing designed to be non-blocking with efficient scheduling