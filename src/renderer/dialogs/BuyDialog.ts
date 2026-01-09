/**
 * BuyDialog - Dialog for purchasing drugs/goods
 *
 * Features:
 * - Drug name and current price display
 * - Max quantity calculation (based on cash and capacity)
 * - Quantity slider for easy selection
 * - Total cost display
 * - Confirm/Cancel buttons
 */

import { Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { gameStateManager } from '@state/GameStateManager';
import { DRUGS } from '@engine/types';
import { createButton, SimpleSlider } from '../ui/SimpleUIHelpers';
import { audioManager } from '@audio/AudioManager';

export class BuyDialog extends BaseDialog {
  private drugId: number = -1;
  private drugNameText!: Text;
  private priceText!: Text;
  private maxQtyText!: Text;
  private quantityText!: Text;
  private totalCostText!: Text;
  private slider!: SimpleSlider;

  private currentQuantity: number = 0;
  private maxQuantity: number = 0;
  private currentPrice: number = 0;

  constructor() {
    super(500, 450, '购买商品');
    this.createBuyDialogUI();
  }

  /**
   * Create buy dialog UI components
   */
  private createBuyDialogUI(): void {
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

    // Current price
    const priceLabel = new Text({
      text: '当前价格:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    priceLabel.x = contentX;
    priceLabel.y = currentY;
    this.addChild(priceLabel);

    this.priceText = new Text({
      text: '',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0x00ff00 }
    });
    this.priceText.x = contentX + 100;
    this.priceText.y = currentY;
    this.addChild(this.priceText);

    currentY += 40;

    // Max quantity
    const maxQtyLabel = new Text({
      text: '最大数量:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    maxQtyLabel.x = contentX;
    maxQtyLabel.y = currentY;
    this.addChild(maxQtyLabel);

    this.maxQtyText = new Text({
      text: '',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffaa00 }
    });
    this.maxQtyText.x = contentX + 100;
    this.maxQtyText.y = currentY;
    this.addChild(this.maxQtyText);

    currentY += 50;

    // Quantity slider
    const sliderLabel = new Text({
      text: '购买数量:',
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

    // Create slider
    this.slider = new SimpleSlider(380, 0, 100, 0);
    this.slider.x = contentX;
    this.slider.y = currentY;
    this.addChild(this.slider);

    this.slider.onValueChange((value) => {
      this.currentQuantity = Math.floor(value);
      this.updateQuantityDisplay();
    });

    currentY += 50;

    // Total cost
    const totalLabel = new Text({
      text: '总花费:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 18, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    totalLabel.x = contentX;
    totalLabel.y = currentY;
    this.addChild(totalLabel);

    this.totalCostText = new Text({
      text: '¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 20, fill: 0xffaa00, fontWeight: 'bold' }
    });
    this.totalCostText.x = contentX + 100;
    this.totalCostText.y = currentY - 2;
    this.addChild(this.totalCostText);

    currentY += 60;

    // Confirm button
    this.createConfirmButton(contentX + 80, currentY);

    // Cancel button
    this.createCancelButton(contentX + 230, currentY);
  }

  /**
   * Create confirm button
   */
  private createConfirmButton(x: number, y: number): void {
    const button = createButton('确认购买', 120, 40, 0x00aa00, () => this.handleConfirm());
    button.x = x;
    button.y = y;
    this.addChild(button);
  }

  /**
   * Create cancel button
   */
  private createCancelButton(x: number, y: number): void {
    const button = createButton('取消', 120, 40, 0x666666, () => this.hide());
    button.x = x;
    button.y = y;
    this.addChild(button);
  }

  /**
   * Update quantity and total cost display
   */
  private updateQuantityDisplay(): void {
    this.quantityText.text = this.currentQuantity.toString();
    const totalCost = this.currentPrice * this.currentQuantity;
    this.totalCostText.text = `¥${totalCost.toLocaleString('zh-CN')}`;
  }

  /**
   * Handle confirm button
   */
  private handleConfirm(): void {
    if (this.currentQuantity === 0) {
      console.log('Purchase cancelled: quantity is 0');
      this.hide();
      return;
    }

    const result = gameStateManager.buyDrug(this.drugId, this.currentQuantity);

    if (result.success) {
      audioManager.play('buy');
      this.hide();
    } else {
      console.error(`Purchase failed: ${result.error}`);
    }
  }

  /**
   * Open dialog for specific drug
   */
  openForDrug(drugId: number): void {
    // CRITICAL: Prevent buying if game is over
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot buy');
      return;
    }

    this.drugId = drugId;

    const state = gameStateManager.getState();
    this.currentPrice = state.marketPrices[drugId];

    // Calculate max quantity based on cash and capacity
    const maxByCash = Math.floor(state.cash / this.currentPrice);
    const currentInventory = state.inventory.reduce((sum, item) => sum + item.quantity, 0);
    const maxByCapacity = state.capacity - currentInventory;
    this.maxQuantity = Math.min(maxByCash, maxByCapacity);

    // Update UI
    this.drugNameText.text = DRUGS[drugId].name;
    this.priceText.text = `¥${this.currentPrice.toLocaleString('zh-CN')}`;
    this.maxQtyText.text = this.maxQuantity.toString();

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
