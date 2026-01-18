/**
 * Inventory List - Displays player's owned items
 * Uses @pixi/ui ScrollBox for scrolling
 *
 * Shows:
 * - Drug name (Chinese)
 * - Quantity owned
 * - Average purchase price
 * - Click to sell
 */

import { Container, Graphics, Text, FillGradient } from 'pixi.js';
import { ScrollBox } from '@pixi/ui';
import type { GameState } from '@engine/types';
import { DRUGS } from '@engine/types';

export class InventoryList extends Container {
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
      text: '库存',
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
   * Create a single inventory item container
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

    // Quantity and price (will be updated)
    const infoText = new Text({
      text: '无',
      style: {
        fontFamily: 'Consolas, Arial',
        fontSize: 12,
        fill: 0x9aa4b2,
      }
    });
    infoText.x = 12;
    infoText.y = 20;
    container.addChild(infoText);
    (container as any).infoText = infoText; // Store reference

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
   * Update list with current inventory
   */
  update(state: GameState): void {
    for (let i = 0; i < 8; i++) {
      const container = this.itemContainers[i];
      const infoText = (container as any).infoText as Text;
      const item = state.inventory[i];

      if (item.quantity === 0) {
        infoText.text = '无';
        infoText.style.fill = 0x6b7280;
        container.interactive = false;
        container.cursor = 'default';
        container.alpha = 0.5;
      } else {
        // Show quantity and average price
        const avgPriceStr = item.avgPrice > 0
          ? ` @ ¥${item.avgPrice.toLocaleString('zh-CN')}`
          : '';
        infoText.text = `数量: ${item.quantity}${avgPriceStr}`;
        infoText.style.fill = 0xfbbf24;
        container.interactive = true;
        container.cursor = 'pointer';
        container.alpha = 1.0;
      }
    }
  }

  /**
   * Set click handler for inventory items
   */
  setOnItemClick(callback: (drugId: number) => void): void {
    this.onItemClick = callback;
  }
}
