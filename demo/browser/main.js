import {
  CameraManager,
  FrameProcessor,
  OffscreenFrameProcessor,
  createDefaultConfig
} from '@/browser/index.ts';

class FrameAnalyzerDemo {
  constructor() {
    this.cameraManager = new CameraManager();
    this.frameProcessor = null;
    this.offscreenProcessor = null;
    this.useOffscreen = false;
    this.isRunning = false;

    // Performance tracking
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.fpsCounter = 0;

    // DOM elements
    this.elements = {
      video: document.getElementById('video'),
      canvas: document.getElementById('canvas'),
      captureOverlay: document.getElementById('captureOverlay'),
      toggleCamera: document.getElementById('toggleCamera'),
      status: document.getElementById('status'),
      output: document.getElementById('output'),
      fps: document.getElementById('fps'),
      frameCount: document.getElementById('frameCount'),

      // Controls
      offsetX: document.getElementById('offsetX'),
      offsetY: document.getElementById('offsetY'),
      windowWidth: document.getElementById('windowWidth'),
      windowHeight: document.getElementById('windowHeight'),
      rows: document.getElementById('rows'),
      columns: document.getElementById('columns'),
      threshold: document.getElementById('threshold')
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateControlValues();
  }

  setupEventListeners() {
    // Button events
    this.elements.toggleCamera.addEventListener('click', () => this.toggleCamera());

    // Control events
    Object.entries(this.elements).forEach(([key, element]) => {
      if (element && element.type === 'range') {
        element.addEventListener('input', () => {
          this.updateControlValues();
          this.updateConfiguration();
        });
      }
    });

    // Window resize handler to update overlay positioning
    window.addEventListener('resize', () => {
      if (this.isRunning) {
        setTimeout(() => this.updateCaptureOverlay(), 100);
      }
    });
  }

  updateControlValues() {
    // Update displayed values for range inputs inline
    const controls = ['offsetX', 'offsetY', 'windowWidth', 'windowHeight', 'rows', 'columns', 'threshold'];
    controls.forEach(control => {
      const element = this.elements[control];
      const valueElement = document.getElementById(`${control}Value`);
      if (element && valueElement) {
        valueElement.textContent = element.value;
      }
    });
  }

  toggleCamera() {
    if (this.isRunning) {
      this.stopCamera();
    } else {
      this.startCamera();
    }
  }

  async startCamera() {
    try {
      this.setStatus('Requesting camera access...', 'info');
      this.elements.toggleCamera.disabled = true;

      // Request camera
      await this.cameraManager.requestCamera({
        width: 640,
        height: 480,
        facingMode: 'environment'
      });

      // Create video element
      const video = this.cameraManager.createVideoElement();
      this.elements.video.replaceWith(video);
      this.elements.video = video;
      video.style.display = 'block';

      // Wait for video to be ready
      await this.cameraManager.waitForVideoReady();

      // Update control ranges based on video dimensions
      this.updateControlRanges();

      // Create frame processor
      this.createFrameProcessor();

      // Start processing
      this.startFrameProcessing();

      // Show and setup overlay - add a small delay to ensure video is fully rendered
      this.elements.captureOverlay.style.display = 'block';
      setTimeout(() => {
        this.updateCaptureOverlay();
      }, 100);

      this.setStatus('Camera started successfully', 'success');
      this.elements.toggleCamera.disabled = false;
      this.elements.toggleCamera.textContent = '🛑 Stop Camera';
      this.elements.toggleCamera.classList.add('active');
      this.isRunning = true;

    } catch (error) {
      console.error('Failed to start camera:', error);
      this.setStatus(`Error: ${error.message}`, 'error');
      this.elements.toggleCamera.disabled = false;
    }
  }

  stopCamera() {
    try {
      // Stop processing
      if (this.frameProcessor) {
        this.frameProcessor.stop();
        this.frameProcessor = null;
      }
      if (this.offscreenProcessor) {
        this.offscreenProcessor.stop();
        this.offscreenProcessor = null;
      }

      // Stop camera
      this.cameraManager.stop();

      // Hide video and overlay
      this.elements.video.style.display = 'none';
      this.elements.captureOverlay.style.display = 'none';

      // Reset UI
      this.elements.output.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">Start camera to see boolean matrix visualization</p>';
      this.elements.fps.textContent = '0';
      this.elements.frameCount.textContent = '0';

      this.setStatus('Camera stopped', 'info');
      this.elements.toggleCamera.disabled = false;
      this.elements.toggleCamera.textContent = '📷 Start Camera';
      this.elements.toggleCamera.classList.remove('active');
      this.isRunning = false;
      this.frameCount = 0;

    } catch (error) {
      console.error('Error stopping camera:', error);
      this.setStatus(`Error: ${error.message}`, 'error');
    }
  }


  createFrameProcessor() {
    try {
      if (this.useOffscreen && OffscreenFrameProcessor.isSupported()) {
        this.offscreenProcessor = new OffscreenFrameProcessor(this.elements.canvas);
      } else {
        this.frameProcessor = new FrameProcessor(this.elements.canvas);
      }
    } catch (error) {
      console.error('Failed to create frame processor:', error);
      // Fallback to regular processor
      this.useOffscreen = false;
      this.frameProcessor = new FrameProcessor(this.elements.canvas);
      this.updateOffscreenButton();
    }
  }

  startFrameProcessing() {
    const config = this.getCurrentConfig();
    const processor = this.useOffscreen ? this.offscreenProcessor : this.frameProcessor;

    if (processor && this.elements.video) {
      processor.start(this.elements.video, config, (result) => {
        this.handleFrameResult(result);
      });
    }
  }

  getCurrentConfig() {
    const { width, height } = this.cameraManager.getVideoDimensions();

    return {
      offsetX: parseInt(this.elements.offsetX.value, 10),
      offsetY: parseInt(this.elements.offsetY.value, 10),
      windowWidth: parseInt(this.elements.windowWidth.value, 10),
      windowHeight: parseInt(this.elements.windowHeight.value, 10),
      rows: parseInt(this.elements.rows.value, 10),
      columns: parseInt(this.elements.columns.value, 10),
      threshold: parseInt(this.elements.threshold.value, 10)
    };
  }

  updateConfiguration() {
    if (!this.isRunning) return;

    const config = this.getCurrentConfig();
    const processor = this.useOffscreen ? this.offscreenProcessor : this.frameProcessor;

    if (processor) {
      processor.updateConfig(config);
    }

    // Update visual overlay
    this.updateCaptureOverlay();
  }

  updateControlRanges() {
    const { width, height } = this.cameraManager.getVideoDimensions();

    this.elements.offsetX.max = width;
    this.elements.offsetY.max = height;
    this.elements.windowWidth.max = width;
    this.elements.windowHeight.max = height;

    // Keep the existing values (don't override defaults)
    this.updateControlValues();
  }

  handleFrameResult(result) {
    this.frameCount++;
    this.fpsCounter++;

    // Update frame count display
    this.elements.frameCount.textContent = this.frameCount.toString();

    // Update FPS (every second)
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.elements.fps.textContent = Math.round(this.fpsCounter).toString();
      this.fpsCounter = 0;
      this.lastFpsUpdate = now;
    }

    // Render boolean matrix
    this.renderBooleanMatrix(result.matrix);
  }

  renderBooleanMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0]?.length || 0;

    // Set minimum cell size for readability
    const minCellSize = 6; // Minimum readable size
    const maxCellSize = 20; // Maximum for small matrices

    // Calculate optimal cell size - prefer readability
    const container = this.elements.output.parentElement;
    const containerWidth = container.offsetWidth - 40;

    // Try to fit, but don't go below minimum
    const calculatedWidth = Math.floor(containerWidth / cols) - 2;
    const calculatedSize = Math.min(calculatedWidth, maxCellSize);
    const finalCellSize = Math.max(calculatedSize, minCellSize);

    // Create grid container (no scrolling, let it grow)
    const gridContainer = document.createElement('div');
    gridContainer.style.border = '1px solid #ddd';
    gridContainer.style.borderRadius = '4px';
    gridContainer.style.padding = '10px';
    gridContainer.style.backgroundColor = '#f9f9f9';
    gridContainer.style.display = 'flex';
    gridContainer.style.justifyContent = 'center';

    // Create grid
    const grid = document.createElement('div');
    grid.className = 'boolean-grid';
    grid.style.display = 'inline-grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, ${finalCellSize}px)`;
    grid.style.gridTemplateRows = `repeat(${rows}, ${finalCellSize}px)`;
    grid.style.gap = '1px';

    // Add cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = document.createElement('div');
        cell.className = `grid-cell ${matrix[row][col] ? 'bright' : 'dark'}`;
        cell.title = `Row ${row}, Col ${col}: ${matrix[row][col] ? 'Bright' : 'Dark'}`;

        // Apply size and styling
        cell.style.width = `${finalCellSize}px`;
        cell.style.height = `${finalCellSize}px`;
        cell.style.border = finalCellSize > 8 ? '1px solid #333' : 'none';
        cell.style.borderRadius = '50%';

        grid.appendChild(cell);
      }
    }

    // Add grid to container
    gridContainer.appendChild(grid);

    // Replace output
    this.elements.output.innerHTML = '';
    this.elements.output.appendChild(gridContainer);

    // Add matrix info
    const info = document.createElement('div');
    info.style.marginTop = '10px';
    info.style.fontSize = '14px';
    info.style.color = '#7f8c8d';
    info.style.textAlign = 'center';

    const brightCount = matrix.flat().filter(Boolean).length;
    const totalCount = rows * cols;

    info.innerHTML = `
      <p>Matrix: ${rows}×${cols} | Cell size: ${finalCellSize}px | Bright: ${brightCount}/${totalCount} (${Math.round(brightCount/totalCount*100)}%)</p>
    `;

    this.elements.output.appendChild(info);
  }

  setStatus(message, type = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
  }

  updateCaptureOverlay() {
    if (!this.isRunning || !this.elements.video || !this.elements.captureOverlay) return;

    const video = this.elements.video;
    const overlay = this.elements.captureOverlay;

    // Wait for video to have dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setTimeout(() => this.updateCaptureOverlay(), 50);
      return;
    }

    // Get video displayed dimensions
    const videoDisplayWidth = video.offsetWidth;
    const videoDisplayHeight = video.offsetHeight;

    // Make sure video has display dimensions
    if (videoDisplayWidth === 0 || videoDisplayHeight === 0) {
      setTimeout(() => this.updateCaptureOverlay(), 50);
      return;
    }

    // Calculate scale factors based on actual vs native video size
    const scaleX = videoDisplayWidth / video.videoWidth;
    const scaleY = videoDisplayHeight / video.videoHeight;

    // Get current config
    const config = this.getCurrentConfig();

    // Position the capture window overlay (relative to video element's top-left)
    const overlayLeft = config.offsetX * scaleX;
    const overlayTop = config.offsetY * scaleY;
    const overlayWidth = config.windowWidth * scaleX;
    const overlayHeight = config.windowHeight * scaleY;

    // Apply styles
    overlay.style.left = `${overlayLeft}px`;
    overlay.style.top = `${overlayTop}px`;
    overlay.style.width = `${overlayWidth}px`;
    overlay.style.height = `${overlayHeight}px`;

    // Ensure overlay is visible
    overlay.style.display = 'block';
    overlay.style.position = 'absolute';
  }
}

// Initialize demo when page loads
document.addEventListener('DOMContentLoaded', () => {
  new FrameAnalyzerDemo();
});