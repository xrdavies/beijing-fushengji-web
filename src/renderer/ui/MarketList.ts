/**
 * Market List - Displays available drugs with prices
 * Uses @pixi/ui ScrollBox for scrolling
 *
 * Shows:
 * - Drug name (Chinese)
 * - Current price
 * - Click to buy
 */

import { Container, Graphics, Text, FillGradient } from 'pixi.js';
import { ScrollBox } from '@pixi/ui';
import type { GameState } from '@engine/types';
import { DRUGS } from '@engine/types';

export class MarketList extends Container {
  private scrollBox: ScrollBox;
  private itemContainers: Container[] = [];
  private onItemClick?: (drugId: number) => void;

  constructor(width: number = 300, height: number = 400) {
    super();

    const panel = new Graphics();
    const panelGradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: 0x242b34 },
        { offset: 1, color: 0x1c222a },
      ],
      textureSpace: 'local',
    });
    panel.roundRect(0, 0, width, height, 12);
    panel.fill(panelGradient);
    panel.stroke({ width: 1, color: 0x2b3440 });
    this.addChild(panel);

    // Title
    const title = new Text({
      text: '市场',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 18,
        fill: 0xf8fafc,
        fontWeight: 'bold',
      }
    });
    title.x = 12;
    title.y = 8;
    this.addChild(title);

    const titleAccent = new Graphics();
    titleAccent.roundRect(12, 30, 28, 3, 2);
    titleAccent.fill(0x3a7bc8);
    this.addChild(titleAccent);

    const listWidth = width - 16;
    const listHeight = height - 52;
    const listPadding = 8;
    const itemWidth = listWidth - listPadding * 2;

    // Create ScrollBox
    this.scrollBox = new ScrollBox({
      width: listWidth,
      height: listHeight,
      background: 0x1d232a,
      radius: 8,
      type: 'vertical',
      padding: listPadding,
      elementsMargin: 6,
    });
    this.scrollBox.x = 8;
    this.scrollBox.y = 40;
    this.addChild(this.scrollBox);

    // Create 8 item slots
    for (let i = 0; i < 8; i++) {
      const itemContainer = this.createItemContainer(i, itemWidth);
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
    const itemHeight = 36;
    const renderBackground = (color: number) => {
      background.clear();
      background.roundRect(0, 0, width, itemHeight, 6);
      background.fill(color);
    };
    renderBackground(0x252c35);
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
    nameText.x = 12;
    nameText.y = 4;
    container.addChild(nameText);

    // Price (will be updated)
    const priceText = new Text({
      text: '无货',
      style: {
        fontFamily: 'Consolas, Arial',
        fontSize: 12,
        fill: 0x9aa4b2,
      }
    });
    priceText.x = 12;
    priceText.y = 20;
    container.addChild(priceText);
    (container as any).priceText = priceText; // Store reference

    // Hover effect
    container.on('pointerover', () => {
      renderBackground(0x334155);
    });

    container.on('pointerout', () => {
      renderBackground(0x252c35);
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
        priceText.style.fill = 0x6b7280;
        container.interactive = false;
        container.cursor = 'default';
        container.alpha = 0.5;
      } else {
        priceText.text = `¥${price.toLocaleString('zh-CN')}`;
        priceText.style.fill = 0x22c55e;
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
