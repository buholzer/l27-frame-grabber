/**
 * Camera access and management for browser environments
 */

export interface CameraConfig {
  /** Preferred video width */
  width?: number;
  /** Preferred video height */
  height?: number;
  /** Camera facing mode */
  facingMode?: 'user' | 'environment';
  /** Video frame rate */
  frameRate?: number;
}

export class CameraManager {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;

  /**
   * Request camera access
   */
  async requestCamera(config: CameraConfig = {}): Promise<MediaStream> {
    const {
      width = 640,
      height = 480,
      facingMode = 'environment',
      frameRate = 30
    } = config;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode,
          frameRate: { ideal: frameRate }
        }
      });

      return this.stream;
    } catch (error) {
      throw new Error(`Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create and setup video element
   */
  createVideoElement(): HTMLVideoElement {
    if (!this.stream) {
      throw new Error('No camera stream available. Call requestCamera() first.');
    }

    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;
    this.video.srcObject = this.stream;

    return this.video;
  }

  /**
   * Wait for video to be ready
   */
  async waitForVideoReady(): Promise<void> {
    if (!this.video) {
      throw new Error('No video element available. Call createVideoElement() first.');
    }

    return new Promise((resolve, reject) => {
      const handleLoadedMetadata = () => {
        if (this.video) {
          this.video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          this.video.removeEventListener('error', handleError);
        }
        resolve();
      };

      const handleError = () => {
        if (this.video) {
          this.video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          this.video.removeEventListener('error', handleError);
        }
        reject(new Error('Video failed to load'));
      };

      if (this.video) {
        this.video.addEventListener('loadedmetadata', handleLoadedMetadata);
        this.video.addEventListener('error', handleError);

        // If already loaded
        if (this.video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          handleLoadedMetadata();
        }
      }
    });
  }

  /**
   * Get current video dimensions
   */
  getVideoDimensions(): { width: number; height: number } {
    if (!this.video) {
      throw new Error('No video element available');
    }

    return {
      width: this.video.videoWidth,
      height: this.video.videoHeight
    };
  }

  /**
   * Stop camera and cleanup resources
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
    }
  }

  /**
   * Get video element (if available)
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }

  /**
   * Check if camera is active
   */
  isActive(): boolean {
    return this.stream !== null && this.video !== null;
  }
}