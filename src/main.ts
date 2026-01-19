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
import { initAnalytics, trackEvent } from '@utils/analytics';

initAnalytics();

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const MAX_TEXT_RESOLUTION = 3;

class Game {
  private app!: Application;
  private sceneManager!: SceneManager;
  private mainGameScene!: MainGameScene;

  async init() {
    console.log('🚀 Beijing Fushengji - Initializing...');

    // Load saved game if exists
    const hasSavedGame = gameStateManager.hasSavedGame();
    if (hasSavedGame) {
      const loaded = gameStateManager.loadGame();
      if (loaded) {
        console.log('💾 Loaded saved game');
      } else {
        console.log('⚠️ Failed to load saved game, starting new game');
      }
    } else {
      console.log('🆕 Starting new game');
    }

    trackEvent('game_start', { has_save: hasSavedGame ? 1 : 0 });

    // Create PixiJS application
    this.app = new Application();

    await this.app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x0a0a0a,
      resolution: window.devicePixelRatio || 1,
      roundPixels: true,
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

      // Render at the display size to avoid CSS scaling blur.
      const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
      const devicePixelRatio = window.devicePixelRatio || 1;
      const textResolution = Math.min(
        devicePixelRatio * Math.max(1, scale),
        MAX_TEXT_RESOLUTION,
      );

      this.app.renderer.resize(width, height, devicePixelRatio);
      this.app.stage.scale.set(scale);
      this.app.stage.position.set(
        Math.round((width - GAME_WIDTH * scale) / 2),
        Math.round((height - GAME_HEIGHT * scale) / 2),
      );
      this.sceneManager.setTextResolution(textResolution);
    };

    // Initial resize
    resizeHandler();

    // Listen for window resize
    window.addEventListener('resize', resizeHandler);

    // Also handle orientation change on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeHandler, 100);
    });
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
