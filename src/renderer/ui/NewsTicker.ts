/**
 * News Ticker - Scrolling text display for news and tips
 * Ported from: CTicker class in the original C++ version
 *
 * Features:
 * - Horizontal scrolling text
 * - Auto-loop through multiple news items
 * - Configurable scroll speed
 */

import { Container, Text, Graphics, FillGradient } from 'pixi.js';

export class NewsTicker extends Container {
  private tickerText: Text;
  private scrollSpeed: number = 1;
  private newsItems: string[] = [];
  private currentIndex: number = 0;
  private containerWidth: number;
  private maskGraphics: Graphics;

  constructor(width: number, height: number = 30) {
    super();

    this.containerWidth = width;

    // Background
    const background = new Graphics();
    const tickerGradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      colorStops: [
        { offset: 0, color: 0x1c232b },
        { offset: 1, color: 0x151a21 },
      ],
      textureSpace: 'local',
    });
    background.roundRect(0, 0, width, height, 8);
    background.fill(tickerGradient);
    background.stroke({ width: 1, color: 0x2b3440 });
    this.addChild(background);

    // Create mask for text overflow
    this.maskGraphics = new Graphics();
    this.maskGraphics.rect(0, 0, width, height);
    this.maskGraphics.fill(0xffffff);
    this.addChild(this.maskGraphics);

    // Create scrolling text
    this.tickerText = new Text({
      text: '',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 13,
        fill: 0xf5c451,
      }
    });
    this.tickerText.y = (height - this.tickerText.height) / 2;
    this.addChild(this.tickerText);

    // Apply mask
    this.tickerText.mask = this.maskGraphics;
  }

  /**
   * Set news items to display
   */
  setNewsItems(items: string[]): void {
    this.newsItems = items;
    this.currentIndex = 0;
    if (items.length > 0) {
      this.loadNews(0);
    }
  }

  /**
   * Load a specific news item
   */
  private loadNews(index: number): void {
    if (index >= 0 && index < this.newsItems.length) {
      this.tickerText.text = this.newsItems[index];
      this.tickerText.x = this.containerWidth; // Start from right edge
      this.currentIndex = index;
    }
  }

  /**
   * Load next news item
   */
  private loadNextNews(): void {
    this.currentIndex = (this.currentIndex + 1) % this.newsItems.length;
    this.loadNews(this.currentIndex);
  }

  /**
   * Update ticker (call in game loop)
   */
  update(delta: number): void {
    if (this.newsItems.length === 0) return;

    // Scroll text to the left
    this.tickerText.x -= this.scrollSpeed * delta;

    // If text has completely scrolled off screen, load next news
    if (this.tickerText.x < -this.tickerText.width) {
      this.loadNextNews();
    }
  }

  /**
   * Set scroll speed
   */
  setScrollSpeed(speed: number): void {
    this.scrollSpeed = speed;
  }

  /**
   * Pause scrolling
   */
  pause(): void {
    this.scrollSpeed = 0;
  }

  /**
   * Resume scrolling
   */
  resume(speed: number = 1): void {
    this.scrollSpeed = speed;
  }
}
