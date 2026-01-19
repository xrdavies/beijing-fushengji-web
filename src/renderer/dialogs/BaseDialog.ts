/**
 * BaseDialog - Abstract base class for all game dialogs
 *
 * Provides common functionality:
 * - Modal overlay background
 * - Close button
 * - Show/hide animations
 * - Event handling
 */

import { Container, Graphics, Text } from 'pixi.js';
import { FancyButton } from '@pixi/ui';

export abstract class BaseDialog extends Container {
  protected background!: Graphics;
  protected panel!: Graphics;
  protected titleText!: Text;
  protected closeButton!: FancyButton;
  protected dialogWidth: number;
  protected dialogHeight: number;

  private escapeKeyHandler?: (event: KeyboardEvent) => void;

  constructor(width: number = 500, height: number = 400, title: string = '对话框') {
    super();
    this.dialogWidth = width;
    this.dialogHeight = height;

    // CRITICAL: Dialog container must block events
    this.eventMode = 'static';

    // Set pivot and position to center for proper scale animation
    // This makes the dialog scale from the center, not from top-left
    this.pivot.set(400, 300); // Center of 800x600 screen
    this.position.set(400, 300); // Position at center

    this.visible = false;
    this.createDialog(title);
    this.setupKeyboardHandlers();
  }

  /**
   * Setup keyboard event handlers
   */
  private setupKeyboardHandlers(): void {
    this.escapeKeyHandler = (event: KeyboardEvent) => {
      if (this.visible && event.key === 'Escape') {
        this.hide();
      }
    };
  }

  /**
   * Create dialog UI (to be called by subclasses)
   */
  protected createDialog(title: string): void {
    // Modal overlay background (semi-transparent black)
    // CRITICAL: Must block all pointer events to prevent click-through
    this.background = new Graphics();
    this.background.rect(0, 0, 800, 600);
    this.background.fill({ color: 0x000000, alpha: 0.7 });
    this.background.eventMode = 'static'; // Block all pointer events
    this.background.cursor = 'default';

    // Consume all pointer events to prevent propagation
    this.background.on('pointerdown', (event) => {
      event.stopPropagation();
    });
    this.background.on('pointerup', (event) => {
      event.stopPropagation();
    });
    this.background.on('pointermove', (event) => {
      event.stopPropagation();
    });
    this.background.on('pointerupoutside', (event) => {
      event.stopPropagation();
    });

    this.addChild(this.background);

    // Dialog panel
    this.panel = new Graphics();
    const x = (800 - this.dialogWidth) / 2;
    const y = (600 - this.dialogHeight) / 2;
    this.panel.roundRect(x, y, this.dialogWidth, this.dialogHeight, 10);
    this.panel.fill(0x2a2a2a);
    this.panel.stroke({ color: 0x4a7bc8, width: 2 });
    this.panel.eventMode = 'static'; // Panel should also block events
    this.addChild(this.panel);

    // Title bar
    const titleBar = new Graphics();
    titleBar.roundRect(x, y, this.dialogWidth, 50, 10);
    titleBar.fill(0x3a7bc8);
    this.addChild(titleBar);

    // Title text
    this.titleText = new Text({
      text: title,
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 20,
        fill: 0xffffff,
        fontWeight: 'bold',
      }
    });
    this.titleText.x = x + 20;
    this.titleText.y = y + 15;
    this.addChild(this.titleText);

    // Close button (X)
    this.createCloseButton(x, y);
  }

  /**
   * Create close button
   * Size increased to 44x44 for better mobile touch targets
   */
  private createCloseButton(panelX: number, panelY: number): void {
    const buttonSize = 44;
    const buttonView = new Container();
    const buttonBg = new Graphics();
    buttonBg.roundRect(0, 0, buttonSize, buttonSize, 5);
    buttonBg.fill(0xff4444);

    const buttonText = new Text({
      text: '✕',
      style: {
        fontFamily: 'Arial',
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: 'bold',
      }
    });
    buttonText.x = buttonSize / 2;
    buttonText.y = buttonSize / 2;
    buttonText.anchor.set(0.5);

    buttonView.addChild(buttonBg);
    buttonView.addChild(buttonText);

    this.closeButton = new FancyButton({
      defaultView: buttonView
    });

    this.closeButton.x = panelX + this.dialogWidth - buttonSize - 10;
    this.closeButton.y = panelY + 3;
    this.addChild(this.closeButton);

    this.closeButton.onPress.connect(() => this.hide());
  }

  /**
   * Show dialog with animation
   */
  show(): void {
    this.visible = true;
    this.alpha = 0;
    this.scale.set(0.9);

    // Add keyboard listener when dialog opens
    if (this.escapeKeyHandler) {
      window.addEventListener('keydown', this.escapeKeyHandler);
    }

    // Fade in animation
    this.animateIn();

    this.onOpen();
  }

  /**
   * Hide dialog with animation
   */
  hide(): void {
    // Fade out animation
    this.animateOut(() => {
      this.visible = false;

      // Remove keyboard listener when dialog closes
      if (this.escapeKeyHandler) {
        window.removeEventListener('keydown', this.escapeKeyHandler);
      }

      this.onClose();
    });
  }

  /**
   * Animate dialog in (fade + scale)
   */
  private animateIn(): void {
    const duration = 200; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      this.alpha = eased;
      this.scale.set(0.9 + eased * 0.1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Animate dialog out (fade + scale)
   */
  private animateOut(onComplete: () => void): void {
    const duration = 150; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: ease-in cubic
      const eased = Math.pow(progress, 3);

      this.alpha = 1 - eased;
      this.scale.set(1 - eased * 0.1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animate();
  }

  /**
   * Called when dialog opens
   */
  protected abstract onOpen(): void;

  /**
   * Called when dialog closes
   */
  protected abstract onClose(): void;

  /**
   * Destroy dialog and cleanup
   */
  destroy(): void {
    // Clean up keyboard listener
    if (this.escapeKeyHandler) {
      window.removeEventListener('keydown', this.escapeKeyHandler);
    }
    super.destroy({ children: true });
  }
}
