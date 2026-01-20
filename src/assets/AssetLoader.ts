/**
 * Asset Loader - Phase-based asset loading system
 *
 * Loading Phases:
 * 1. Splash Screen Assets (cover image)
 * 2. Game UI Assets (backgrounds, UI elements)
 * 3. Icon Sprites (22 icons as sprite sheet)
 * 4. Data Files (news.json, tips.json)
 * 5. Audio Files (40 sound effects)
 */

import { Texture } from 'pixi.js';

export interface LoadProgress {
  phase: number;
  totalPhases: number;
  phaseName: string;
  progress: number; // 0-1
}

export class AssetLoader {
  private textures: Map<string, Texture> = new Map();
  private data: Map<string, any> = new Map();
  private onProgressCallback?: (progress: LoadProgress) => void;

  /**
   * Set progress callback
   */
  onProgress(callback: (progress: LoadProgress) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * Report loading progress
   */
  private reportProgress(phase: number, totalPhases: number, phaseName: string, progress: number): void {
    if (this.onProgressCallback) {
      this.onProgressCallback({ phase, totalPhases, phaseName, progress });
    }
  }

  /**
   * Load all critical assets
   * TODO: Replace placeholder URLs with actual asset paths when assets are ready
   */
  async loadCriticalAssets(): Promise<void> {
    const totalPhases = 4;

    // Phase 1: Splash Screen Assets
    this.reportProgress(1, totalPhases, 'Loading splash screen', 0);
    await this.loadSplashAssets();
    this.reportProgress(1, totalPhases, 'Loading splash screen', 1);

    // Phase 2: Game UI Assets
    this.reportProgress(2, totalPhases, 'Loading game UI', 0);
    await this.loadGameUIAssets();
    this.reportProgress(2, totalPhases, 'Loading game UI', 1);

    // Phase 3: Icon Sprites
    this.reportProgress(3, totalPhases, 'Loading icons', 0);
    await this.loadIconSprites();
    this.reportProgress(3, totalPhases, 'Loading icons', 1);

    // Phase 4: Data Files
    this.reportProgress(4, totalPhases, 'Loading game data', 0);
    await this.loadDataFiles();
    this.reportProgress(4, totalPhases, 'Loading game data', 1);
  }

  /**
   * Phase 1: Load splash screen assets
   */
  private async loadSplashAssets(): Promise<void> {
    // TODO: Load actual cover.webp when available
    // For now, skip - will use placeholder graphics
    console.log('📦 Phase 1: Splash assets (placeholder mode)');
  }

  /**
   * Phase 2: Load game UI assets
   */
  private async loadGameUIAssets(): Promise<void> {
    // TODO: Load actual game backgrounds and UI elements
    // - game-backg.webp
    // - bg.webp
    // - logo.webp
    // - subway.webp
    // - City backgrounds (Beijing/Shanghai)

    console.log('📦 Phase 2: Game UI assets (placeholder mode)');

    // For now, we'll use PixiJS Graphics for all UI
    // This allows us to build the UI without waiting for assets
  }

  /**
   * Phase 3: Load icon sprites
   */
  private async loadIconSprites(): Promise<void> {
    // TODO: Load sprite sheet when AssetPack processing is ready
    // npx assetpack will generate:
    // - public/assets/sprites/icons.json
    // - public/assets/sprites/icons.png

    console.log('📦 Phase 3: Icon sprites (placeholder mode)');

    // For now, we'll use PixiJS Graphics for icons
  }

  /**
   * Phase 4: Load data files
   */
  private async loadDataFiles(): Promise<void> {
    console.log('📦 Phase 4: Loading game data...');

    try {
      // Load news data
      // TODO: Convert News.txt to news.json
      // For now, use placeholder data
      this.data.set('news', {
        items: [
          '市场行情播报：各地商品价格波动频繁，请注意市场风险...',
          '小道消息：专家预测明年市场将有重大变化...',
          '经济观察：投资需谨慎，理性对待价格波动...',
        ]
      });

      // Load tips data
      // TODO: Convert Tips.txt to tips.json
      this.data.set('tips', {
        items: [
          '提示：低买高卖是赚钱的基本原则',
          '提示：注意管理你的债务，10%的利息会快速累积',
          '提示：保持健康很重要，治疗费用很贵',
          '提示：扩大容量可以携带更多商品',
        ]
      });

      console.log('✅ Game data loaded');
    } catch (error) {
      console.error('Failed to load game data:', error);
      // Non-critical, game can run without news/tips
    }
  }

  /**
   * Load secondary assets (audio)
   * TODO: Implement when audio files are converted
   */
  async loadSecondaryAssets(): Promise<void> {
    console.log('📦 Loading secondary assets (audio)...');

    // TODO: Convert WAV → MP3 (40 files)
    // Priority sounds:
    // - buy.mp3
    // - money.mp3 (sell)
    // - opendoor.mp3
    // - shutdoor.mp3
    // - death.mp3
    // - kill.mp3
    // - flight.mp3

    console.log('⚠️  Audio assets not yet converted - will be loaded in Phase 4');
  }

  /**
   * Get loaded texture
   */
  getTexture(key: string): Texture | null {
    return this.textures.get(key) || null;
  }

  /**
   * Get loaded data
   */
  getData<T = any>(key: string): T | null {
    return this.data.get(key) || null;
  }

  /**
   * Check if asset is loaded
   */
  hasTexture(key: string): boolean {
    return this.textures.has(key);
  }

  /**
   * Check if data is loaded
   */
  hasData(key: string): boolean {
    return this.data.has(key);
  }

  /**
   * Get news items
   */
  getNewsItems(): string[] {
    const newsData = this.getData<{ items: string[] }>('news');
    return newsData?.items || [];
  }

  /**
   * Get tips items
   */
  getTipsItems(): string[] {
    const tipsData = this.getData<{ items: string[] }>('tips');
    return tipsData?.items || [];
  }
}

// Export singleton instance
export const assetLoader = new AssetLoader();
