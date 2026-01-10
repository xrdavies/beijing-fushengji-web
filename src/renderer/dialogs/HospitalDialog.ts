/**
 * HospitalDialog - Dialog for health restoration
 *
 * Features:
 * - Current health display
 * - Max health display
 * - Health points to restore slider
 * - Cost per health point (¥3,500)
 * - Total cost calculation
 * - Confirm/Cancel buttons
 */

import { Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { gameStateManager } from '@state/GameStateManager';
import { GAME_CONSTANTS } from '@engine/types';
import { createButton, SimpleSlider } from '../ui/SimpleUIHelpers';

export class HospitalDialog extends BaseDialog {
  private currentHealthText!: Text;
  private maxHealthText!: Text;
  private healthPointsText!: Text;
  private costPerPointText!: Text;
  private totalCostText!: Text;
  private slider!: SimpleSlider;

  private healthPoints: number = 0;
  private maxHealthPoints: number = 0;
  private currentHealth: number = 0;

  constructor() {
    super(500, 450, '医院');
    this.createHospitalDialogUI();
  }

  /**
   * Create hospital dialog UI components
   */
  private createHospitalDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 80;

    // Current health
    const currentHealthLabel = new Text({
      text: '当前健康:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    currentHealthLabel.x = contentX;
    currentHealthLabel.y = currentY;
    this.addChild(currentHealthLabel);

    this.currentHealthText = new Text({
      text: '100',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0x00ff00, fontWeight: 'bold' }
    });
    this.currentHealthText.x = contentX + 120;
    this.currentHealthText.y = currentY;
    this.addChild(this.currentHealthText);

    currentY += 40;

    // Max health
    const maxHealthLabel = new Text({
      text: '最大健康:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    maxHealthLabel.x = contentX;
    maxHealthLabel.y = currentY;
    this.addChild(maxHealthLabel);

    this.maxHealthText = new Text({
      text: '100',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffffff }
    });
    this.maxHealthText.x = contentX + 120;
    this.maxHealthText.y = currentY;
    this.addChild(this.maxHealthText);

    currentY += 50;

    // Cost per point
    const costPerPointLabel = new Text({
      text: '治疗费用:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    costPerPointLabel.x = contentX;
    costPerPointLabel.y = currentY;
    this.addChild(costPerPointLabel);

    this.costPerPointText = new Text({
      text: `¥${GAME_CONSTANTS.HOSPITAL_COST_PER_HP.toLocaleString('zh-CN')} / 点`,
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffaa00 }
    });
    this.costPerPointText.x = contentX + 120;
    this.costPerPointText.y = currentY;
    this.addChild(this.costPerPointText);

    currentY += 50;

    // Health points slider
    const sliderLabel = new Text({
      text: '恢复健康:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    sliderLabel.x = contentX;
    sliderLabel.y = currentY;
    this.addChild(sliderLabel);

    this.healthPointsText = new Text({
      text: '0 点',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 18, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.healthPointsText.x = contentX + 320;
    this.healthPointsText.y = currentY - 2;
    this.addChild(this.healthPointsText);

    currentY += 35;

    // Create slider using SimpleSlider
    this.slider = new SimpleSlider(380, 0, 100, 0);
    this.slider.x = contentX;
    this.slider.y = currentY;
    this.addChild(this.slider);

    this.slider.onValueChange((value) => {
      this.healthPoints = Math.floor(value);
      this.updateHealthDisplay();
    });

    currentY += 60;

    // Total cost
    const totalCostLabel = new Text({
      text: '总费用:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 18, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    totalCostLabel.x = contentX;
    totalCostLabel.y = currentY;
    this.addChild(totalCostLabel);

    this.totalCostText = new Text({
      text: '¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 20, fill: 0xff4444, fontWeight: 'bold' }
    });
    this.totalCostText.x = contentX + 120;
    this.totalCostText.y = currentY - 2;
    this.addChild(this.totalCostText);

    currentY += 60;

    // Buttons
    const confirmButton = createButton('接受治疗', 120, 40, 0x00aa00, () => this.handleConfirm());
    confirmButton.x = contentX + 80;
    confirmButton.y = currentY;
    this.addChild(confirmButton);

    const cancelButton = createButton('取消', 120, 40, 0x666666, () => this.hide());
    cancelButton.x = contentX + 230;
    cancelButton.y = currentY;
    this.addChild(cancelButton);
  }

  /**
   * Update health and cost display
   */
  private updateHealthDisplay(): void {
    this.healthPointsText.text = `${this.healthPoints} 点`;

    const totalCost = this.healthPoints * GAME_CONSTANTS.HOSPITAL_COST_PER_HP;
    this.totalCostText.text = `¥${totalCost.toLocaleString('zh-CN')}`;

    // Color code health text
    const newHealth = this.currentHealth + this.healthPoints;
    if (newHealth >= 60) {
      this.healthPointsText.style.fill = 0x00ff00;
    } else if (newHealth >= 30) {
      this.healthPointsText.style.fill = 0xffaa00;
    } else {
      this.healthPointsText.style.fill = 0xff4444;
    }
  }

  /**
   * Handle confirm button
   */
  private handleConfirm(): void {
    if (this.healthPoints === 0) {
      console.log('Treatment cancelled: no health points selected');
      this.hide();
      return;
    }

    const result = gameStateManager.visitHospital(this.healthPoints);

    if (result.success) {
      this.hide();
    } else {
      console.error(`Hospital visit failed: ${result.error}`);
    }
  }

  /**
   * Open hospital dialog
   */
  open(): void {
    // CRITICAL: Prevent opening if game is over
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot open hospital');

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
    this.currentHealth = state.health;

    // Calculate max health points (limited by cash and max health)
    const maxByCash = Math.floor(state.cash / GAME_CONSTANTS.HOSPITAL_COST_PER_HP);
    const maxByHealth = GAME_CONSTANTS.MAX_HEALTH - state.health;
    this.maxHealthPoints = Math.min(maxByCash, maxByHealth);

    // Update UI
    this.currentHealthText.text = state.health.toString();

    // Color code current health
    if (state.health >= 60) {
      this.currentHealthText.style.fill = 0x00ff00;
    } else if (state.health >= 30) {
      this.currentHealthText.style.fill = 0xffaa00;
    } else {
      this.currentHealthText.style.fill = 0xff4444;
    }

    this.maxHealthText.text = GAME_CONSTANTS.MAX_HEALTH.toString();

    // Reset slider
    this.slider.setMax(this.maxHealthPoints);
    this.slider.setValue(0);
    this.healthPoints = 0;
    this.updateHealthDisplay();

    this.show();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }
}
