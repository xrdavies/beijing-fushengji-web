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

import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { audioManager } from '@audio/AudioManager';
import { gameStateManager } from '@state/GameStateManager';
import { GAME_CONSTANTS } from '@engine/types';
import { createButton, SimpleSlider } from '../ui/SimpleUIHelpers';

export class BankDialog extends BaseDialog {
  private mode: 'deposit' | 'withdraw' | 'repay' = 'deposit';

  private tabWidth: number = 120;
  private tabHeight: number = 40;

  private depositTabBg!: Graphics;
  private withdrawTabBg!: Graphics;
  private repayTabBg!: Graphics;
  private depositTabText!: Text;
  private withdrawTabText!: Text;
  private repayTabText!: Text;

  private cashText!: Text;
  private bankText!: Text;
  private debtText!: Text;
  private amountText!: Text;
  private slider!: SimpleSlider;
  private confirmButton!: Container;
  private confirmButtonText: Text | null = null;

  private currentAmount: number = 0;
  private maxAmount: number = 0;

  constructor() {
    super(500, 450, '银行');
    this.doorSoundsEnabled = true;
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

    currentY += 30;

    // Debt balance
    const debtLabel = new Text({
      text: '债务:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    debtLabel.x = contentX;
    debtLabel.y = currentY;
    this.addChild(debtLabel);

    this.debtText = new Text({
      text: '¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xff6666 }
    });
    this.debtText.x = contentX + 80;
    this.debtText.y = currentY;
    this.addChild(this.debtText);

    currentY += 35;

    // Interest rate info
    const interestInfo = new Text({
      text: `存款利息: ${GAME_CONSTANTS.BANK_INTEREST_RATE * 100}% 每天`,
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xffaa00 }
    });
    interestInfo.x = contentX;
    interestInfo.y = currentY;
    this.addChild(interestInfo);

    const debtInterestInfo = new Text({
      text: `债务利息: ${GAME_CONSTANTS.DEBT_INTEREST_RATE * 100}% 每天`,
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xff8f8f }
    });
    debtInterestInfo.x = contentX;
    debtInterestInfo.y = currentY + 20;
    this.addChild(debtInterestInfo);

    currentY += 52;

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
    this.confirmButton = createButton('确认', 120, 40, 0x00aa00, () => this.handleConfirm());
    this.confirmButton.x = contentX + 80;
    this.confirmButton.y = currentY;
    this.addChild(this.confirmButton);

    this.confirmButtonText = this.confirmButton.children.find(
      (child) => child instanceof Text
    ) as Text | undefined || null;
    this.updateConfirmButtonLabel();

    const cancelButton = createButton('取消', 120, 40, 0x666666, () => this.hide());
    cancelButton.x = contentX + 230;
    cancelButton.y = currentY;
    this.addChild(cancelButton);
  }

  /**
   * Create tab buttons for deposit/withdraw
   */
  private createTabButtons(x: number, y: number): void {
    const tabWidth = this.tabWidth;
    const tabHeight = this.tabHeight;
    const tabRadius = 6;
    const tabGap = 12;
    const textStyle: TextStyleOptions = {
      fontFamily: 'Microsoft YaHei, Arial',
      fontSize: 16,
      fill: 0xffffff,
      fontWeight: 'bold',
    };
    const totalWidth = tabWidth * 3 + tabGap * 2;
    const availableWidth = this.dialogWidth - 60;
    const startX = x + Math.max(0, Math.round((availableWidth - totalWidth) / 2));

    const createTab = (label: string, onClick: () => void, index: number) => {
      const container = new Container();
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.x = startX + index * (tabWidth + tabGap);
      container.y = y;

      const bg = new Graphics();
      bg.roundRect(0, 0, tabWidth, tabHeight, tabRadius);
      container.addChild(bg);

      const text = new Text({ text: label, style: textStyle });
      text.anchor.set(0.5);
      text.x = tabWidth / 2;
      text.y = tabHeight / 2;
      container.addChild(text);

      container.on('pointerdown', onClick);

      return { container, bg, text };
    };

    const depositTab = createTab('存款', () => this.switchMode('deposit'), 0);
    this.addChild(depositTab.container);
    this.depositTabBg = depositTab.bg;
    this.depositTabText = depositTab.text;

    const withdrawTab = createTab('取款', () => this.switchMode('withdraw'), 1);
    this.addChild(withdrawTab.container);
    this.withdrawTabBg = withdrawTab.bg;
    this.withdrawTabText = withdrawTab.text;

    const repayTab = createTab('还债', () => this.switchMode('repay'), 2);
    this.addChild(repayTab.container);
    this.repayTabBg = repayTab.bg;
    this.repayTabText = repayTab.text;

    this.updateTabStyles();
  }

  /**
   * Switch between deposit and withdraw modes
   */
  private switchMode(mode: 'deposit' | 'withdraw' | 'repay'): void {
    this.mode = mode;
    this.updateTabStyles();
    this.updateConfirmButtonLabel();
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
    } else if (this.mode === 'withdraw') {
      this.maxAmount = state.bank;
    } else {
      this.maxAmount = Math.min(state.cash + state.bank, state.debt);
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
    } else if (this.mode === 'withdraw') {
      result = gameStateManager.withdrawBank(this.currentAmount);
    } else {
      result = gameStateManager.payDebt(this.currentAmount);
    }

    if (result && result.success) {
      audioManager.play('sell');
      this.hide();
    } else if (result) {
      console.error(`Bank transaction failed: ${result.error}`);
    }
  }

  /**
   * Open bank dialog
   */
  open(): void {
    // CRITICAL: Prevent opening if game is over (time up OR player dead)
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot open bank');

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
    this.cashText.text = `¥${state.cash.toLocaleString('zh-CN')}`;
    this.bankText.text = `¥${state.bank.toLocaleString('zh-CN')}`;
    this.debtText.text = `¥${state.debt.toLocaleString('zh-CN')}`;

    this.mode = 'deposit';
    this.updateTabStyles();
    this.updateConfirmButtonLabel();
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

  private updateTabStyles(): void {
    const activeColor = 0x3a7bc8;
    const inactiveColor = 0x666666;
    const activeText = 0xffffff;
    const inactiveText = 0xdddddd;
    const tabWidth = this.tabWidth;
    const tabHeight = this.tabHeight;

    if (this.depositTabBg && this.depositTabText) {
      this.depositTabBg.clear();
      this.depositTabBg.roundRect(0, 0, tabWidth, tabHeight, 6);
      this.depositTabBg.fill(this.mode === 'deposit' ? activeColor : inactiveColor);
      this.depositTabText.style.fill = this.mode === 'deposit' ? activeText : inactiveText;
    }

    if (this.withdrawTabBg && this.withdrawTabText) {
      this.withdrawTabBg.clear();
      this.withdrawTabBg.roundRect(0, 0, tabWidth, tabHeight, 6);
      this.withdrawTabBg.fill(this.mode === 'withdraw' ? activeColor : inactiveColor);
      this.withdrawTabText.style.fill = this.mode === 'withdraw' ? activeText : inactiveText;
    }

    if (this.repayTabBg && this.repayTabText) {
      this.repayTabBg.clear();
      this.repayTabBg.roundRect(0, 0, tabWidth, tabHeight, 6);
      this.repayTabBg.fill(this.mode === 'repay' ? activeColor : inactiveColor);
      this.repayTabText.style.fill = this.mode === 'repay' ? activeText : inactiveText;
    }
  }

  private updateConfirmButtonLabel(): void {
    if (!this.confirmButtonText) {
      return;
    }

    if (this.mode === 'deposit') {
      this.confirmButtonText.text = '确认存款';
    } else if (this.mode === 'withdraw') {
      this.confirmButtonText.text = '确认取款';
    } else {
      this.confirmButtonText.text = '确认还债';
    }
  }
}
