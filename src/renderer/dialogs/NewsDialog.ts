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
    // Compact dialog size (60% of original)
    super(330, 240, '消息');
    this.createNewsDialogUI();
  }

  /**
   * Create news dialog UI components
   */
  private createNewsDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 20;
    const contentWidth = this.dialogWidth - 40;
    const contentTop = panelY + 68;
    const buttonWidth = 120;
    const buttonHeight = 34;
    const buttonY = panelY + this.dialogHeight - 18 - buttonHeight;

    // Message text (word wrapped, left-aligned for better Chinese text readability)
    this.messageText = new Text({
      text: '',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 13,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: contentWidth, // Use full content width
        breakWords: true, // CRITICAL: Allow breaking Chinese text at any character
        align: 'left', // Left-align for better readability with wrapped Chinese text
        lineHeight: 22,
      }
    });
    this.messageText.x = contentX;
    this.messageText.y = contentTop;
    this.messageText.anchor.set(0, 0);
    this.addChild(this.messageText);

    // OK button
    const okButton = createButton('确定', buttonWidth, buttonHeight, 0x3a7bc8, () => this.hide());
    okButton.x = panelX + (this.dialogWidth - buttonWidth) / 2;
    okButton.y = buttonY;
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
