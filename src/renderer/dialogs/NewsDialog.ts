/**
 * NewsDialog - Dialog for displaying game event messages
 *
 * Features:
 * - Display event message
 * - Optional icon/image
 * - OK button to close
 * - Auto-width based on message length
 */

import { Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { createButton } from '../ui/SimpleUIHelpers';

export class NewsDialog extends BaseDialog {
  private messageText!: Text;

  constructor() {
    super(500, 350, '消息');
    this.createNewsDialogUI();
  }

  /**
   * Create news dialog UI components
   */
  private createNewsDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 100;

    // Message text (word wrapped)
    this.messageText = new Text({
      text: '',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 16,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 420,
        align: 'center',
        lineHeight: 24,
      }
    });
    this.messageText.x = contentX + 210;
    this.messageText.y = currentY;
    this.messageText.anchor.set(0.5, 0);
    this.addChild(this.messageText);

    currentY += 150;

    // OK button
    const okButton = createButton('确定', 140, 40, 0x3a7bc8, () => this.hide());
    okButton.x = contentX + 160;
    okButton.y = currentY;
    this.addChild(okButton);
  }

  /**
   * Show news message
   */
  showMessage(message: string, title: string = '消息'): void {
    // Update title
    this.titleText.text = title;

    // Update message
    this.messageText.text = message;

    this.show();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }
}
