/**
 * HouseDialog - Dialog for renting house to increase capacity
 *
 * Features:
 * - Current capacity display
 * - New capacity display
 * - Upgrade cost display
 * - Confirm/Cancel buttons
 */

import { Container, Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { gameStateManager } from '@state/GameStateManager';
import { GAME_CONSTANTS } from '@engine/types';
import { createButton } from '../ui/SimpleUIHelpers';

export class HouseDialog extends BaseDialog {
  private currentCapacityText!: Text;
  private newCapacityText!: Text;
  private costText!: Text;
  private confirmButton!: Container;

  private currentCapacity: number = 0;
  private upgradeCost: number = 0;

  constructor() {
    super(500, 400, '假中介');
    this.doorSoundsEnabled = true;
    this.createHouseDialogUI();
  }

  /**
   * Create house dialog UI components
   */
  private createHouseDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 80;

    // Description
    const description = new Text({
      text: '租用更大的房屋可以增加背包容量',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa }
    });
    description.x = contentX;
    description.y = currentY;
    this.addChild(description);

    currentY += 50;

    // New capacity
    const newCapacityLabel = new Text({
      text: '升级后:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    newCapacityLabel.x = contentX;
    newCapacityLabel.y = currentY;
    this.addChild(newCapacityLabel);

    this.newCapacityText = new Text({
      text: '150',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0x00ff00, fontWeight: 'bold' }
    });
    this.newCapacityText.x = contentX + 120;
    this.newCapacityText.y = currentY;
    this.addChild(this.newCapacityText);

    currentY += 40;

    // Current capacity
    const currentCapacityLabel = new Text({
      text: '当前容量:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    currentCapacityLabel.x = contentX;
    currentCapacityLabel.y = currentY;
    this.addChild(currentCapacityLabel);

    this.currentCapacityText = new Text({
      text: '100',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.currentCapacityText.x = contentX + 120;
    this.currentCapacityText.y = currentY;
    this.addChild(this.currentCapacityText);

    // Arrow showing increase
    const increaseText = new Text({
      text: `↑ +${GAME_CONSTANTS.HOUSE_CAPACITY_INCREASE}`,
      style: { fontFamily: 'Arial', fontSize: 18, fill: 0x00ff00, fontWeight: 'bold' }
    });
    increaseText.x = contentX + 220;
    increaseText.y = Math.round(
      (this.newCapacityText.y + this.currentCapacityText.y - increaseText.height) / 2
    );
    this.addChild(increaseText);

    currentY += 50;

    // Cost
    const costLabel = new Text({
      text: '租金:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 18, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    costLabel.x = contentX;
    costLabel.y = currentY;
    this.addChild(costLabel);

    this.costText = new Text({
      text: `¥${GAME_CONSTANTS.HOUSE_RENT_MIN.toLocaleString('zh-CN')}`,
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 20, fill: 0xff4444, fontWeight: 'bold' }
    });
    this.costText.x = contentX + 120;
    this.costText.y = currentY - 2;
    this.addChild(this.costText);

    currentY += 70;

    // Buttons
    this.confirmButton = createButton('租用房屋', 120, 40, 0x00aa00, () => this.handleConfirm());
    this.confirmButton.x = contentX + 80;
    this.confirmButton.y = currentY;
    this.addChild(this.confirmButton);

    const cancelButton = createButton('取消', 120, 40, 0x666666, () => this.hide());
    cancelButton.x = contentX + 230;
    cancelButton.y = currentY;
    this.addChild(cancelButton);
  }

  /**
   * Handle confirm button
   */
  private handleConfirm(): void {
    const result = gameStateManager.rentHouse();

    if (result.success) {
      this.hide();
    } else {
      console.error(`House rental failed: ${result.error}`);
    }
  }

  /**
   * Open house dialog
   */
  open(): void {
    // CRITICAL: Prevent opening if game is over (time up OR player dead)
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot open house');

      // Show game over dialog
      const gameOverDialog = this.parent?.children.find(
        (child) => child.constructor.name === 'GameOverDialog'
      ) as any;

      if (gameOverDialog && gameOverDialog.open) {
        gameOverDialog.open();
      }
      return;
    }

    const state = gameStateManager.getState();
    this.currentCapacity = state.capacity;
    this.upgradeCost = this.calculateUpgradeCost(state.cash);
    const isMaxCapacity = state.capacity >= GAME_CONSTANTS.MAX_CAPACITY;
    const canAfford = state.cash >= this.upgradeCost;

    // Update UI
    this.currentCapacityText.text = this.currentCapacity.toString();
    this.newCapacityText.text = Math.min(
      this.currentCapacity + GAME_CONSTANTS.HOUSE_CAPACITY_INCREASE,
      GAME_CONSTANTS.MAX_CAPACITY
    ).toString();
    if (isMaxCapacity) {
      this.costText.text = '已达上限';
      this.costText.style.fill = 0x888888;
    } else {
      this.costText.text = `¥${this.upgradeCost.toLocaleString('zh-CN')}`;
      this.costText.style.fill = canAfford ? 0x00ff00 : 0xff4444;
    }
    this.updateConfirmButtonState(!isMaxCapacity && canAfford);

    this.show();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }

  private calculateUpgradeCost(cash: number): number {
    if (cash <= GAME_CONSTANTS.HOUSE_RENT_RICH_THRESHOLD) {
      return GAME_CONSTANTS.HOUSE_RENT_MIN;
    }
    return Math.floor(cash / 2) - 2000;
  }

  private updateConfirmButtonState(enabled: boolean): void {
    this.confirmButton.alpha = enabled ? 1 : 0.5;
    this.confirmButton.eventMode = enabled ? 'static' : 'none';
    this.confirmButton.cursor = enabled ? 'pointer' : 'default';
  }
}
