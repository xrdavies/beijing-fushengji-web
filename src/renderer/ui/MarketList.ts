/**
 * Market List - Displays available drugs with prices
 * Uses @pixi/ui ScrollBox for scrolling
 *
 * Shows:
 * - Drug name (Chinese)
 * - Current price
 * - Click to buy
 */

import { Container, Graphics, Text } from 'pixi.js';
import { ScrollBox } from '@pixi/ui';
import type { GameState } from '@engine/types';
import { DRUGS } from '@engine/types';

export class MarketList extends Container {
  private scrollBox: ScrollBox;
  private itemContainers: Container[] = [];
  private onItemClick?: (drugId: number) => void;

  constructor(width: number = 300, height: number = 400) {
    super();

    // Title
    const title = new Text({
      text: '市场',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: 'bold',
      }
    });
    title.x = 5;
    title.y = 0;
    this.addChild(title);

    // Create ScrollBox
    this.scrollBox = new ScrollBox({
      width,
      height: height - 30,
      background: 0x1a1a1a,
      radius: 5,
    });
    this.scrollBox.y = 30;
    this.addChild(this.scrollBox);

    // Create 8 item slots
    for (let i = 0; i < 8; i++) {
      const itemContainer = this.createItemContainer(i, width);
      itemContainer.y = i * 50;
      this.scrollBox.addItem(itemContainer); // Use addItem for ScrollBox
      this.itemContainers.push(itemContainer);
    }
  }

  /**
   * Create a single market item container
   */
  private createItemContainer(drugId: number, width: number): Container {
    const container = new Container();
    container.interactive = true;
    container.cursor = 'pointer';

    // Background (hover effect)
    const background = new Graphics();
    background.roundRect(5, 0, width - 15, 45, 5);
    background.fill(0x2a2a2a);
    container.addChild(background);

    // Drug name
    const nameText = new Text({
      text: DRUGS[drugId].name,
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 14,
        fill: 0xffffff,
      }
    });
    nameText.x = 15;
    nameText.y = 5;
    container.addChild(nameText);

    // Price (will be updated)
    const priceText = new Text({
      text: '无货',
      style: {
        fontFamily: 'Consolas, Arial',
        fontSize: 13,
        fill: 0xaaaaaa,
      }
    });
    priceText.x = 15;
    priceText.y = 25;
    container.addChild(priceText);
    (container as any).priceText = priceText; // Store reference

    // Hover effect
    container.on('pointerover', () => {
      background.tint = 0xcccccc;
    });

    container.on('pointerout', () => {
      background.tint = 0xffffff;
    });

    // Click handler
    container.on('pointertap', () => {
      if (this.onItemClick) {
        this.onItemClick(drugId);
      }
    });

    return container;
  }

  /**
   * Update list with current market prices
   */
  update(state: GameState): void {
    for (let i = 0; i < 8; i++) {
      const container = this.itemContainers[i];
      const priceText = (container as any).priceText as Text;
      const price = state.marketPrices[i];

      if (price === 0) {
        priceText.text = '无货';
        priceText.style.fill = 0x666666;
        container.interactive = false;
        container.cursor = 'default';
        container.alpha = 0.5;
      } else {
        priceText.text = `¥${price.toLocaleString('zh-CN')}`;
        priceText.style.fill = 0x00ff00;
        container.interactive = true;
        container.cursor = 'pointer';
        container.alpha = 1.0;
      }
    }
  }

  /**
   * Set click handler for market items
   */
  setOnItemClick(callback: (drugId: number) => void): void {
    this.onItemClick = callback;
  }
}
