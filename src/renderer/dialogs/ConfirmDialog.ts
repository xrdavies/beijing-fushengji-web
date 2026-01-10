/**
 * ConfirmDialog - Custom confirmation dialog
 *
 * Features:
 * - Displays a message with confirm/cancel buttons
 * - Callback-based confirmation handling
 * - Replaces native window.confirm()
 */

import { Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { createButton } from '../ui/SimpleUIHelpers';

export class ConfirmDialog extends BaseDialog {
  private messageText!: Text;
  private onConfirmCallback?: () => void;
  private onCancelCallback?: () => void;

  constructor() {
    super(450, 250, '确认');
    this.createConfirmDialogUI();
  }

  /**
   * Create confirm dialog UI components
   */
  private createConfirmDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 90;

    // Message text
    this.messageText = new Text({
      text: '',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 16,
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 380,
        lineHeight: 24,
      }
    });
    this.messageText.x = panelX + this.dialogWidth / 2;
    this.messageText.y = currentY;
    this.messageText.anchor.set(0.5, 0);
    this.addChild(this.messageText);

    currentY += 90;

    // Confirm button
    const confirmButton = createButton('确定', 120, 40, 0x00aa00, () => this.handleConfirm());
    confirmButton.x = contentX + 60;
    confirmButton.y = currentY;
    this.addChild(confirmButton);

    // Cancel button
    const cancelButton = createButton('取消', 120, 40, 0x666666, () => this.handleCancel());
    cancelButton.x = contentX + 220;
    cancelButton.y = currentY;
    this.addChild(cancelButton);
  }

  /**
   * Handle confirm button
   */
  private handleConfirm(): void {
    this.hide();
    if (this.onConfirmCallback) {
      this.onConfirmCallback();
    }
  }

  /**
   * Handle cancel button
   */
  private handleCancel(): void {
    this.hide();
    if (this.onCancelCallback) {
      this.onCancelCallback();
    }
  }

  /**
   * Show confirmation dialog with message and callbacks
   */
  showConfirm(
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.messageText.text = message;
    this.onConfirmCallback = onConfirm;
    this.onCancelCallback = onCancel;
    this.show();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Clear callbacks when dialog closes
    this.onConfirmCallback = undefined;
    this.onCancelCallback = undefined;
  }
}
