/**
 * Scene Manager - Manages PixiJS layers and scene transitions
 *
 * Layer Hierarchy:
 * - BackgroundLayer: Static backgrounds, city scenes
 * - GameLayer: Main game UI, trading interface
 * - DialogLayer: Modal dialogs
 * - TickerLayer: News ticker, notifications
 * - OverlayLayer: Boss screen, splash screens
 */

import { Application, Container } from 'pixi.js';

export class SceneManager {
  private app: Application;

  // Layer containers
  public backgroundLayer: Container;
  public gameLayer: Container;
  public dialogLayer: Container;
  public tickerLayer: Container;
  public overlayLayer: Container;

  constructor(app: Application) {
    this.app = app;

    // Create layers in order (bottom to top)
    this.backgroundLayer = new Container();
    this.backgroundLayer.label = 'BackgroundLayer';

    this.gameLayer = new Container();
    this.gameLayer.label = 'GameLayer';

    this.dialogLayer = new Container();
    this.dialogLayer.label = 'DialogLayer';
    this.dialogLayer.visible = false; // Hidden by default

    this.tickerLayer = new Container();
    this.tickerLayer.label = 'TickerLayer';

    this.overlayLayer = new Container();
    this.overlayLayer.label = 'OverlayLayer';
    this.overlayLayer.visible = false; // Hidden by default

    // Add layers to stage
    this.app.stage.addChild(this.backgroundLayer);
    this.app.stage.addChild(this.gameLayer);
    this.app.stage.addChild(this.dialogLayer);
    this.app.stage.addChild(this.tickerLayer);
    this.app.stage.addChild(this.overlayLayer);
  }

  /**
   * Show main game UI
   */
  showMainGame(): void {
    this.backgroundLayer.visible = true;
    this.gameLayer.visible = true;
    this.tickerLayer.visible = true;
    this.dialogLayer.visible = false;
    this.overlayLayer.visible = false;
  }

  /**
   * Show splash screen
   */
  showSplashScreen(): void {
    this.backgroundLayer.visible = false;
    this.gameLayer.visible = false;
    this.tickerLayer.visible = false;
    this.dialogLayer.visible = false;
    this.overlayLayer.visible = true;
  }

  /**
   * Open dialog
   */
  openDialog(dialog: Container): void {
    this.dialogLayer.removeChildren();
    this.dialogLayer.addChild(dialog);
    this.dialogLayer.visible = true;
  }

  /**
   * Close dialog
   */
  closeDialog(): void {
    this.dialogLayer.visible = false;
    this.dialogLayer.removeChildren();
  }

  /**
   * Show boss protection screen
   */
  showBossScreen(): void {
    this.overlayLayer.visible = true;
  }

  /**
   * Hide boss protection screen
   */
  hideBossScreen(): void {
    this.overlayLayer.visible = false;
  }

  /**
   * Clear all layers
   */
  clearAll(): void {
    this.backgroundLayer.removeChildren();
    this.gameLayer.removeChildren();
    this.dialogLayer.removeChildren();
    this.tickerLayer.removeChildren();
    this.overlayLayer.removeChildren();
  }

  /**
   * Resize handler
   */
  resize(_width: number, _height: number): void {
    // TODO: Implement responsive scaling
    // For now, assume fixed 800x600 resolution
  }
}
