import { analyzeFrame, type FrameAnalyzerConfig, type FrameAnalysisResult } from '../core/index.js';

/**
 * Callback function for frame analysis results
 */
export type FrameCallback = (result: FrameAnalysisResult) => void;

/**
 * Real-time frame processor for browser video streams
 */
export class FrameProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private video: HTMLVideoElement | null = null;
  private config: FrameAnalyzerConfig | null = null;
  private callback: FrameCallback | null = null;
  private isProcessing = false;
  private animationId: number | null = null;

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas || document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = context;
  }

  /**
   * Start processing frames from video element
   */
  start(
    video: HTMLVideoElement,
    config: FrameAnalyzerConfig,
    callback: FrameCallback
  ): void {
    this.video = video;
    this.config = config;
    this.callback = callback;
    this.isProcessing = true;

    // Sync canvas size with video
    this.updateCanvasSize();

    // Start processing loop
    this.processFrame();
  }

  /**
   * Stop processing frames
   */
  stop(): void {
    this.isProcessing = false;
    if (this.animationId !== null) {
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && this.video) {
        // Cancel video frame callback if supported
        // Note: cancelVideoFrameCallback doesn't exist in standard API yet
      } else {
        cancelAnimationFrame(this.animationId);
      }
      this.animationId = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: FrameAnalyzerConfig): void {
    this.config = config;
  }

  /**
   * Get the canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Update canvas size to match video
   */
  private updateCanvasSize(): void {
    if (!this.video) return;

    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
  }

  /**
   * Process a single frame
   */
  private processFrame = (): void => {
    if (!this.isProcessing || !this.video || !this.config || !this.callback) {
      return;
    }

    try {
      // Draw video frame to canvas
      this.ctx.drawImage(
        this.video,
        0, 0,
        this.canvas.width,
        this.canvas.height
      );

      // Get image data
      const imageData = this.ctx.getImageData(
        0, 0,
        this.canvas.width,
        this.canvas.height
      );

      // Analyze frame
      const result = analyzeFrame(imageData, this.config);

      // Call callback with result
      this.callback(result);
    } catch (error) {
      console.error('Frame processing error:', error);
    }

    // Schedule next frame
    this.scheduleNextFrame();
  };

  /**
   * Schedule the next frame processing
   */
  private scheduleNextFrame(): void {
    if (!this.isProcessing) return;

    // Use requestVideoFrameCallback if available (better sync with video)
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && this.video) {
      this.video.requestVideoFrameCallback(this.processFrame);
    } else {
      // Fallback to requestAnimationFrame
      this.animationId = requestAnimationFrame(this.processFrame);
    }
  }
}

/**
 * High-performance frame processor using OffscreenCanvas and Web Worker
 * Note: This is a simplified version - in production you'd want to move
 * the heavy processing to a Web Worker
 */
export class OffscreenFrameProcessor {
  private canvas: HTMLCanvasElement;
  private offscreenCanvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private video: HTMLVideoElement | null = null;
  private config: FrameAnalyzerConfig | null = null;
  private callback: FrameCallback | null = null;
  private isProcessing = false;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Try to create OffscreenCanvas
    if ('OffscreenCanvas' in window) {
      this.offscreenCanvas = this.canvas.transferControlToOffscreen();
      this.ctx = this.offscreenCanvas.getContext('2d');
    }
  }

  /**
   * Check if OffscreenCanvas is supported
   */
  static isSupported(): boolean {
    return 'OffscreenCanvas' in window;
  }

  /**
   * Start processing (similar to FrameProcessor but uses OffscreenCanvas)
   */
  start(
    video: HTMLVideoElement,
    config: FrameAnalyzerConfig,
    callback: FrameCallback
  ): void {
    if (!this.offscreenCanvas || !this.ctx) {
      throw new Error('OffscreenCanvas not supported or failed to initialize');
    }

    this.video = video;
    this.config = config;
    this.callback = callback;
    this.isProcessing = true;

    this.processFrame();
  }

  /**
   * Stop processing
   */
  stop(): void {
    this.isProcessing = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: FrameAnalyzerConfig): void {
    this.config = config;
  }

  /**
   * Process frame using OffscreenCanvas
   */
  private processFrame = (): void => {
    if (!this.isProcessing || !this.video || !this.config || !this.callback || !this.ctx || !this.offscreenCanvas) {
      return;
    }

    try {
      // Update canvas size if needed
      if (this.offscreenCanvas.width !== this.video.videoWidth ||
          this.offscreenCanvas.height !== this.video.videoHeight) {
        this.offscreenCanvas.width = this.video.videoWidth;
        this.offscreenCanvas.height = this.video.videoHeight;
      }

      // Draw video frame
      this.ctx.drawImage(
        this.video,
        0, 0,
        this.offscreenCanvas.width,
        this.offscreenCanvas.height
      );

      // Get image data
      const imageData = this.ctx.getImageData(
        0, 0,
        this.offscreenCanvas.width,
        this.offscreenCanvas.height
      );

      // Analyze frame
      const result = analyzeFrame(imageData, this.config);

      // Call callback
      this.callback(result);
    } catch (error) {
      console.error('Offscreen frame processing error:', error);
    }

    // Schedule next frame
    if (this.isProcessing) {
      this.animationId = requestAnimationFrame(this.processFrame);
    }
  };
}