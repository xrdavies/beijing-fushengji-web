/**
 * SellDialog - Dialog for selling drugs/goods
 *
 * Features:
 * - Drug name and current market price display
 * - Average purchase price display
 * - Quantity owned display
 * - Quantity slider
 * - Profit/loss calculation and display
 * - Confirm/Cancel buttons
 */

import { Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { gameStateManager } from '@state/GameStateManager';
import { DRUGS } from '@engine/types';
import { createButton, SimpleSlider } from '../ui/SimpleUIHelpers';
import { audioManager } from '@audio/AudioManager';

export class SellDialog extends BaseDialog {
  private drugId: number = -1;
  private drugNameText!: Text;
  private marketPriceText!: Text;
  private avgPriceText!: Text;
  private ownedQtyText!: Text;
  private quantityText!: Text;
  private totalGainText!: Text;
  private profitText!: Text;
  private slider!: SimpleSlider;

  private currentQuantity: number = 0;
  private maxQuantity: number = 0;
  private marketPrice: number = 0;
  private avgPrice: number = 0;

  constructor() {
    super(500, 500, '出售商品');
    this.createSellDialogUI();
  }

  /**
   * Create sell dialog UI components
   */
  private createSellDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 80;

    // Drug name
    const drugNameLabel = new Text({
      text: '商品名称:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    drugNameLabel.x = contentX;
    drugNameLabel.y = currentY;
    this.addChild(drugNameLabel);

    this.drugNameText = new Text({
      text: '',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.drugNameText.x = contentX + 100;
    this.drugNameText.y = currentY;
    this.addChild(this.drugNameText);

    currentY += 40;

    // Market price
    const marketPriceLabel = new Text({
      text: '市场价格:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    marketPriceLabel.x = contentX;
    marketPriceLabel.y = currentY;
    this.addChild(marketPriceLabel);

    this.marketPriceText = new Text({
      text: '',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0x00ff00 }
    });
    this.marketPriceText.x = contentX + 100;
    this.marketPriceText.y = currentY;
    this.addChild(this.marketPriceText);

    currentY += 40;

    // Average purchase price
    const avgPriceLabel = new Text({
      text: '购入均价:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    avgPriceLabel.x = contentX;
    avgPriceLabel.y = currentY;
    this.addChild(avgPriceLabel);

    this.avgPriceText = new Text({
      text: '',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffaa00 }
    });
    this.avgPriceText.x = contentX + 100;
    this.avgPriceText.y = currentY;
    this.addChild(this.avgPriceText);

    currentY += 40;

    // Owned quantity
    const ownedQtyLabel = new Text({
      text: '持有数量:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    ownedQtyLabel.x = contentX;
    ownedQtyLabel.y = currentY;
    this.addChild(ownedQtyLabel);

    this.ownedQtyText = new Text({
      text: '',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffffff }
    });
    this.ownedQtyText.x = contentX + 100;
    this.ownedQtyText.y = currentY;
    this.addChild(this.ownedQtyText);

    currentY += 50;

    // Quantity slider
    const sliderLabel = new Text({
      text: '出售数量:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    sliderLabel.x = contentX;
    sliderLabel.y = currentY;
    this.addChild(sliderLabel);

    this.quantityText = new Text({
      text: '0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 18, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.quantityText.x = contentX + 350;
    this.quantityText.y = currentY - 2;
    this.addChild(this.quantityText);

    currentY += 35;

    // Create slider using SimpleSlider
    this.slider = new SimpleSlider(380, 0, 100, 0);
    this.slider.x = contentX;
    this.slider.y = currentY;
    this.addChild(this.slider);

    this.slider.onValueChange((value) => {
      this.currentQuantity = Math.floor(value);
      this.updateQuantityDisplay();
    });

    currentY += 50;

    // Total gain
    const totalLabel = new Text({
      text: '总收入:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 18, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    totalLabel.x = contentX;
    totalLabel.y = currentY;
    this.addChild(totalLabel);

    this.totalGainText = new Text({
      text: '¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 20, fill: 0xffaa00, fontWeight: 'bold' }
    });
    this.totalGainText.x = contentX + 100;
    this.totalGainText.y = currentY - 2;
    this.addChild(this.totalGainText);

    currentY += 35;

    // Profit/loss
    const profitLabel = new Text({
      text: '盈亏:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 18, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    profitLabel.x = contentX;
    profitLabel.y = currentY;
    this.addChild(profitLabel);

    this.profitText = new Text({
      text: '¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 20, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.profitText.x = contentX + 100;
    this.profitText.y = currentY - 2;
    this.addChild(this.profitText);

    currentY += 60;

    // Buttons
    const confirmButton = createButton('确认出售', 120, 40, 0x00aa00, () => this.handleConfirm());
    confirmButton.x = contentX + 80;
    confirmButton.y = currentY;
    this.addChild(confirmButton);

    const cancelButton = createButton('取消', 120, 40, 0x666666, () => this.hide());
    cancelButton.x = contentX + 230;
    cancelButton.y = currentY;
    this.addChild(cancelButton);
  }

  /**
   * Update quantity, total gain, and profit display
   */
  private updateQuantityDisplay(): void {
    this.quantityText.text = this.currentQuantity.toString();

    const totalGain = this.marketPrice * this.currentQuantity;
    this.totalGainText.text = `¥${totalGain.toLocaleString('zh-CN')}`;

    const profit = (this.marketPrice - this.avgPrice) * this.currentQuantity;
    this.profitText.text = `¥${profit.toLocaleString('zh-CN')}`;

    // Color code profit (green for profit, red for loss)
    if (profit > 0) {
      this.profitText.style.fill = 0x00ff00;
    } else if (profit < 0) {
      this.profitText.style.fill = 0xff4444;
    } else {
      this.profitText.style.fill = 0xffffff;
    }
  }

  /**
   * Handle confirm button
   */
  private handleConfirm(): void {
    if (this.currentQuantity === 0) {
      console.log('Sale cancelled: quantity is 0');
      this.hide();
      return;
    }

    const result = gameStateManager.sellDrug(this.drugId, this.currentQuantity);

    if (result.success) {
      audioManager.play('sell');
      this.hide();
    } else {
      console.error(`Sale failed: ${result.error}`);
    }
  }

  /**
   * Open dialog for specific drug
   */
  openForDrug(drugId: number): void {
    // CRITICAL: Prevent selling if game is over
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot sell');
      return;
    }

    this.drugId = drugId;

    const state = gameStateManager.getState();
    const item = state.inventory[drugId];
    this.marketPrice = state.marketPrices[drugId];
    this.avgPrice = item.avgPrice;
    this.maxQuantity = item.quantity;

    // Update UI
    this.drugNameText.text = DRUGS[drugId].name;
    this.marketPriceText.text = `¥${this.marketPrice.toLocaleString('zh-CN')}`;
    this.avgPriceText.text = `¥${this.avgPrice.toLocaleString('zh-CN')}`;
    this.ownedQtyText.text = this.maxQuantity.toString();

    // Reset slider
    this.slider.setMax(this.maxQuantity);
    this.slider.setValue(0);
    this.currentQuantity = 0;
    this.updateQuantityDisplay();

    this.show();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }
}
