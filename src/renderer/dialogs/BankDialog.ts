/**
 * BankDialog - Dialog for banking operations
 *
 * Features:
 * - Deposit/Withdraw tab switcher
 * - Current cash and bank balance display
 * - Amount input via slider
 * - Interest rate information
 * - Confirm/Cancel buttons
 */

import { Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { gameStateManager } from '@state/GameStateManager';
import { GAME_CONSTANTS } from '@engine/types';
import { createButton, SimpleSlider } from '../ui/SimpleUIHelpers';

export class BankDialog extends BaseDialog {
  private mode: 'deposit' | 'withdraw' = 'deposit';

  private cashText!: Text;
  private bankText!: Text;
  private amountText!: Text;
  private slider!: SimpleSlider;

  private currentAmount: number = 0;
  private maxAmount: number = 0;

  constructor() {
    super(500, 450, '银行');
    this.createBankDialogUI();
  }

  /**
   * Create bank dialog UI components
   */
  private createBankDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 80;

    // Tab buttons (Deposit/Withdraw)
    this.createTabButtons(contentX, currentY);

    currentY += 60;

    // Current cash
    const cashLabel = new Text({
      text: '现金:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    cashLabel.x = contentX;
    cashLabel.y = currentY;
    this.addChild(cashLabel);

    this.cashText = new Text({
      text: '¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0x00ff00 }
    });
    this.cashText.x = contentX + 80;
    this.cashText.y = currentY;
    this.addChild(this.cashText);

    currentY += 35;

    // Bank balance
    const bankLabel = new Text({
      text: '存款:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    bankLabel.x = contentX;
    bankLabel.y = currentY;
    this.addChild(bankLabel);

    this.bankText = new Text({
      text: '¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0x00ff00 }
    });
    this.bankText.x = contentX + 80;
    this.bankText.y = currentY;
    this.addChild(this.bankText);

    currentY += 50;

    // Interest rate info
    const interestInfo = new Text({
      text: `存款利息: ${GAME_CONSTANTS.BANK_INTEREST_RATE * 100}% 每天`,
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xffaa00 }
    });
    interestInfo.x = contentX;
    interestInfo.y = currentY;
    this.addChild(interestInfo);

    currentY += 40;

    // Amount slider
    const sliderLabel = new Text({
      text: '金额:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    sliderLabel.x = contentX;
    sliderLabel.y = currentY;
    this.addChild(sliderLabel);

    this.amountText = new Text({
      text: '¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 18, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.amountText.x = contentX + 300;
    this.amountText.y = currentY - 2;
    this.addChild(this.amountText);

    currentY += 35;

    // Create slider using SimpleSlider
    this.slider = new SimpleSlider(380, 0, 10000, 0);
    this.slider.x = contentX;
    this.slider.y = currentY;
    this.addChild(this.slider);

    this.slider.onValueChange((value) => {
      this.currentAmount = Math.floor(value);
      this.updateAmountDisplay();
    });

    currentY += 80;

    // Buttons
    const confirmButton = createButton('确认', 120, 40, 0x00aa00, () => this.handleConfirm());
    confirmButton.x = contentX + 80;
    confirmButton.y = currentY;
    this.addChild(confirmButton);

    const cancelButton = createButton('取消', 120, 40, 0x666666, () => this.hide());
    cancelButton.x = contentX + 230;
    cancelButton.y = currentY;
    this.addChild(cancelButton);
  }

  /**
   * Create tab buttons for deposit/withdraw
   */
  private createTabButtons(x: number, y: number): void {
    const depositButton = createButton('存款', 150, 40, 0x3a7bc8, () => this.switchMode('deposit'));
    depositButton.x = x + 50;
    depositButton.y = y;
    this.addChild(depositButton);

    const withdrawButton = createButton('取款', 150, 40, 0x666666, () => this.switchMode('withdraw'));
    withdrawButton.x = x + 220;
    withdrawButton.y = y;
    this.addChild(withdrawButton);
  }

  /**
   * Switch between deposit and withdraw modes
   */
  private switchMode(mode: 'deposit' | 'withdraw'): void {
    this.mode = mode;
    this.updateMaxAmount();
    this.slider.setValue(0);
    this.currentAmount = 0;
    this.updateAmountDisplay();

    console.log(`Switched to ${mode} mode`);
  }

  /**
   * Update max amount based on mode
   */
  private updateMaxAmount(): void {
    const state = gameStateManager.getState();
    if (this.mode === 'deposit') {
      this.maxAmount = state.cash;
    } else {
      this.maxAmount = state.bank;
    }
    this.slider.setMax(this.maxAmount);
  }

  /**
   * Update amount display
   */
  private updateAmountDisplay(): void {
    this.amountText.text = `¥${this.currentAmount.toLocaleString('zh-CN')}`;
  }

  /**
   * Handle confirm button
   */
  private handleConfirm(): void {
    if (this.currentAmount === 0) {
      console.log('Operation cancelled: amount is 0');
      this.hide();
      return;
    }

    let result;
    if (this.mode === 'deposit') {
      result = gameStateManager.depositBank(this.currentAmount);
    } else {
      result = gameStateManager.withdrawBank(this.currentAmount);
    }

    if (result && result.success) {
      this.hide();
    } else if (result) {
      console.error(`Bank transaction failed: ${result.error}`);
    }
  }

  /**
   * Open bank dialog
   */
  open(): void {
    const state = gameStateManager.getState();
    this.cashText.text = `¥${state.cash.toLocaleString('zh-CN')}`;
    this.bankText.text = `¥${state.bank.toLocaleString('zh-CN')}`;

    this.mode = 'deposit';
    this.updateMaxAmount();
    this.slider.setValue(0);
    this.currentAmount = 0;
    this.updateAmountDisplay();

    this.show();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }
}
