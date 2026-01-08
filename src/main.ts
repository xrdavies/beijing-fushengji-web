/**
 * Beijing Fushengji - Web Version
 * Main application entry point
 *
 * Built with PixiJS v8, TypeScript, and Vite
 * Original game: (C) 2000-2012 Guo Xianghao
 * Web port: GPL v2.0
 */

import { Application } from 'pixi.js';
import { SceneManager } from '@renderer/SceneManager';
import { MainGameScene } from '@renderer/scenes/MainGameScene';
import { gameStateManager } from '@state/GameStateManager';
import { assetLoader } from '@assets/AssetLoader';
import { audioManager } from '@audio/AudioManager';

class Game {
  private app!: Application;
  private sceneManager!: SceneManager;
  private mainGameScene!: MainGameScene;

  async init() {
    console.log('🚀 Beijing Fushengji - Initializing...');

    // Create PixiJS application
    this.app = new Application();

    await this.app.init({
      width: 800,
      height: 600,
      backgroundColor: 0x0a0a0a,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Add canvas to DOM
    document.body.appendChild(this.app.canvas);

    // Load assets
    await this.loadAssets();

    // Load audio (critical sounds)
    await this.loadAudio();

    // Create scene manager
    this.sceneManager = new SceneManager(this.app);

    // Create main game scene
    this.mainGameScene = new MainGameScene(this.app);
    this.sceneManager.gameLayer.addChild(this.mainGameScene);

    // Show main game
    this.sceneManager.showMainGame();

    // Setup window resize handler
    this.setupResizeHandler();

    // Hide loading screen
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }

    console.log('✅ Beijing Fushengji - Ready!');
    console.log('📊 Initial state:', gameStateManager.getState());
  }

  /**
   * Setup window resize handler for responsive scaling
   */
  private setupResizeHandler(): void {
    const resizeHandler = () => {
      // Get new window size
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Calculate scale to fit 800x600 game
      const scaleX = width / 800;
      const scaleY = height / 600;
      const scale = Math.min(scaleX, scaleY);

      // Update renderer size
      this.app.renderer.resize(width, height);

      // Scale and center the game scene
      this.mainGameScene.scale.set(scale);
      this.mainGameScene.x = (width - 800 * scale) / 2;
      this.mainGameScene.y = (height - 600 * scale) / 2;
    };

    // Initial resize
    resizeHandler();

    // Listen for window resize
    window.addEventListener('resize', resizeHandler);
  }

  /**
   * Load game assets
   */
  private async loadAssets(): Promise<void> {
    console.log('📦 Loading assets...');

    // Set up progress callback
    assetLoader.onProgress((progress) => {
      const loadingText = document.querySelector('.loading-text:last-child');
      if (loadingText) {
        loadingText.textContent = `${progress.phaseName} (${Math.floor(progress.progress * 100)}%)`;
      }
    });

    // Load critical assets
    await assetLoader.loadCriticalAssets();

    console.log('✅ Assets loaded');
  }

  /**
   * Load audio (critical sounds first)
   */
  private async loadAudio(): Promise<void> {
    console.log('🔊 Loading audio...');

    const loadingText = document.querySelector('.loading-text:last-child');
    if (loadingText) {
      loadingText.textContent = 'Loading sounds...';
    }

    // Load critical sounds
    await audioManager.loadCriticalSounds();

    console.log('✅ Audio loaded');

    // Load secondary sounds in background
    audioManager.loadSecondarySounds().catch((error) => {
      console.warn('Failed to load some secondary sounds:', error);
    });
  }
}

// Initialize game
const game = new Game();
game.init().catch((error) => {
  console.error('❌ Failed to initialize game:', error);

  // Show error to user
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.innerHTML = `
      <div>初始化失败</div>
      <div class="loading-text">Failed to initialize game</div>
      <div class="loading-text">${error.message}</div>
    `;
  }
});
