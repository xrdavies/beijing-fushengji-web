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

import { Container, Graphics, Text } from 'pixi.js';
import { ScrollBox } from '@pixi/ui';
import type { GameState } from '@engine/types';
import { DRUGS } from '@engine/types';

export class InventoryList extends Container {
  private scrollBox: ScrollBox;
  private itemContainers: Container[] = [];
  private onItemClick?: (drugId: number) => void;

  constructor(width: number = 300, height: number = 400) {
    super();

    // Title
    const title = new Text({
      text: '库存',
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
   * Create a single inventory item container
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

    // Quantity and price (will be updated)
    const infoText = new Text({
      text: '无',
      style: {
        fontFamily: 'Consolas, Arial',
        fontSize: 12,
        fill: 0xaaaaaa,
      }
    });
    infoText.x = 15;
    infoText.y = 25;
    container.addChild(infoText);
    (container as any).infoText = infoText; // Store reference

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
   * Update list with current inventory
   */
  update(state: GameState): void {
    for (let i = 0; i < 8; i++) {
      const container = this.itemContainers[i];
      const infoText = (container as any).infoText as Text;
      const item = state.inventory[i];

      if (item.quantity === 0) {
        infoText.text = '无';
        infoText.style.fill = 0x666666;
        container.interactive = false;
        container.cursor = 'default';
        container.alpha = 0.5;
      } else {
        // Show quantity and average price
        const avgPriceStr = item.avgPrice > 0
          ? ` @ ¥${item.avgPrice.toLocaleString('zh-CN')}`
          : '';
        infoText.text = `数量: ${item.quantity}${avgPriceStr}`;
        infoText.style.fill = 0xffdd00;
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
