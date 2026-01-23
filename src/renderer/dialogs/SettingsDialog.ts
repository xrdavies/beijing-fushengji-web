/**
 * SettingsDialog - Game settings dialog
 *
 * Features:
 * - Sound enable/disable toggle
 * - Hacking mode toggle
 * - New game button
 * - Save/Load buttons (future)
 */

import { Graphics, Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { gameStateManager } from '@state/GameStateManager';
import { createButton, SimpleCheckbox } from '../ui/SimpleUIHelpers';

export class SettingsDialog extends BaseDialog {
  private soundCheckbox!: SimpleCheckbox;
  private hackingCheckbox!: SimpleCheckbox;

  constructor() {
    super(350, 320, '设置');
    this.createSettingsDialogUI();
  }

  /**
   * Create settings dialog UI components
   */
  private createSettingsDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 20;
    const contentWidth = this.dialogWidth - 40;
    const checkboxGap = 8;
    let currentY = panelY + 70;

    // Sound setting
    const soundLabel = new Text({
      text: '音效',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa }
    });
    this.addChild(soundLabel);

    // Sound checkbox using SimpleCheckbox
    const state = gameStateManager.getState();
    this.soundCheckbox = new SimpleCheckbox(state.soundEnabled);
    this.soundCheckbox.x = contentX;
    this.addChild(this.soundCheckbox);

    this.soundCheckbox.onValueChange((checked: boolean) => {
      gameStateManager.setState({ soundEnabled: checked });
      console.log(`Sound ${checked ? 'enabled' : 'disabled'}`);
    });

    const soundRowHeight = Math.max(soundLabel.height, this.soundCheckbox.height);
    const soundRowWidth = this.soundCheckbox.width + checkboxGap + soundLabel.width;
    soundLabel.y = currentY + (soundRowHeight - soundLabel.height) / 2;
    this.soundCheckbox.y = currentY + (soundRowHeight - this.soundCheckbox.height) / 2;
    currentY += soundRowHeight + 12;

    // Hacking setting
    const hackingLabel = new Text({
      text: '黑客模式(增加网吧收益50%)',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa }
    });
    this.addChild(hackingLabel);

    // Hacking checkbox using SimpleCheckbox
    this.hackingCheckbox = new SimpleCheckbox(state.hackingEnabled);
    this.hackingCheckbox.x = contentX;
    this.addChild(this.hackingCheckbox);

    this.hackingCheckbox.onValueChange((checked: boolean) => {
      gameStateManager.setState({ hackingEnabled: checked });
      console.log(`Hacking mode ${checked ? 'enabled' : 'disabled'}`);
    });

    const hackingRowHeight = Math.max(hackingLabel.height, this.hackingCheckbox.height);
    const hackingRowWidth = this.hackingCheckbox.width + checkboxGap + hackingLabel.width;
    const groupWidth = Math.max(soundRowWidth, hackingRowWidth);
    const groupX = panelX + (this.dialogWidth - groupWidth) / 2;
    this.soundCheckbox.x = groupX;
    soundLabel.x = this.soundCheckbox.x + this.soundCheckbox.width + checkboxGap;
    this.hackingCheckbox.x = groupX;
    hackingLabel.x = this.hackingCheckbox.x + this.hackingCheckbox.width + checkboxGap;
    hackingLabel.y = currentY + (hackingRowHeight - hackingLabel.height) / 2;
    this.hackingCheckbox.y =
      currentY + (hackingRowHeight - this.hackingCheckbox.height) / 2;
    currentY += hackingRowHeight + 14;

    // Divider line
    const divider = new Graphics();
    divider.moveTo(contentX, currentY);
    divider.lineTo(contentX + contentWidth, currentY);
    divider.stroke({ color: 0x444444, width: 1 });
    this.addChild(divider);

    currentY += 14;

    // Buttons
    const newGameButton = createButton('开始新游戏', 120, 32, 0xff4444, () => this.handleNewGame());
    newGameButton.x = panelX + (this.dialogWidth - 120) / 2;
    newGameButton.y = currentY;
    this.addChild(newGameButton);

    currentY += 38;

    // About section divider
    const aboutDivider = new Graphics();
    aboutDivider.moveTo(contentX, currentY);
    aboutDivider.lineTo(contentX + contentWidth, currentY);
    aboutDivider.stroke({ color: 0x444444, width: 1 });
    this.addChild(aboutDivider);

    currentY += 11;

    // About section title
    const aboutTitle = new Text({
      text: '关于',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 12, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    aboutTitle.x = contentX;
    aboutTitle.y = currentY;
    this.addChild(aboutTitle);

    currentY += 16;

    // Version info
    const versionText = new Text({
      text: '北京浮生记 Web版 v1.0.0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 11, fill: 0x888888 }
    });
    versionText.x = contentX;
    versionText.y = currentY;
    this.addChild(versionText);

    currentY += 13;

    // Credits
    const webAuthorText = new Text({
      text: 'Frozen (2026)',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 10, fill: 0x888888 }
    });
    webAuthorText.x = contentX;
    webAuthorText.y = currentY;
    this.addChild(webAuthorText);

    currentY += 13;

    // GitHub link
    const githubText = new Text({
      text: 'https://github.com/xrdavies/beijing-fushengji-web',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 10, fill: 0x4a9eff }
    });
    githubText.x = contentX;
    githubText.y = currentY;
    githubText.eventMode = 'static';
    githubText.cursor = 'pointer';
    githubText.on('pointerdown', () => {
      window.open('https://github.com/xrdavies/beijing-fushengji-web', '_blank');
    });
    githubText.on('pointerover', () => {
      githubText.style.fill = 0x6bb6ff;
    });
    githubText.on('pointerout', () => {
      githubText.style.fill = 0x4a9eff;
    });
    this.addChild(githubText);

    currentY += 14;

    // Developer link
    const developerText = new Text({
      text: 'https://x.com/xrdavies',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 10, fill: 0x4a9eff }
    });
    developerText.x = contentX;
    developerText.y = currentY;
    developerText.eventMode = 'static';
    developerText.cursor = 'pointer';
    developerText.on('pointerdown', () => {
      window.open('https://x.com/xrdavies', '_blank');
    });
    developerText.on('pointerover', () => {
      developerText.style.fill = 0x6bb6ff;
    });
    developerText.on('pointerout', () => {
      developerText.style.fill = 0x4a9eff;
    });
    this.addChild(developerText);
  }

  /**
   * Handle new game button
   */
  private handleNewGame(): void {
    // Use custom confirm dialog
    const confirmDialog = this.parent?.children.find(
      (child) => child.constructor.name === 'ConfirmDialog'
    ) as any;

    if (confirmDialog && confirmDialog.showConfirm) {
      confirmDialog.showConfirm(
        '确定要开始新游戏吗？当前进度将丢失！',
        () => {
          gameStateManager.resetGame();
          console.log('New game started');
          this.hide();
        }
      );
    } else {
      // Fallback to native confirm if custom dialog not found
      if (confirm('确定要开始新游戏吗？当前进度将丢失！')) {
        gameStateManager.resetGame();
        console.log('New game started');
        this.hide();
      }
    }
  }

  /**
   * Open settings dialog
   */
  open(): void {
    // Update checkbox states
    const state = gameStateManager.getState();
    this.soundCheckbox.setChecked(state.soundEnabled);
    this.hackingCheckbox.setChecked(state.hackingEnabled);

    this.show();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }
}
