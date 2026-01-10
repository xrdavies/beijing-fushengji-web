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
    super(500, 500, '设置');
    this.createSettingsDialogUI();
  }

  /**
   * Create settings dialog UI components
   */
  private createSettingsDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 100;

    // Sound setting
    const soundLabel = new Text({
      text: '音效:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    soundLabel.x = contentX;
    soundLabel.y = currentY;
    this.addChild(soundLabel);

    // Sound checkbox using SimpleCheckbox
    const state = gameStateManager.getState();
    this.soundCheckbox = new SimpleCheckbox(state.soundEnabled);
    this.soundCheckbox.x = contentX + 200;
    this.soundCheckbox.y = currentY;
    this.addChild(this.soundCheckbox);

    this.soundCheckbox.onValueChange((checked: boolean) => {
      gameStateManager.setState({ soundEnabled: checked });
      console.log(`Sound ${checked ? 'enabled' : 'disabled'}`);
    });

    currentY += 60;

    // Hacking setting
    const hackingLabel = new Text({
      text: '黑客模式:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    hackingLabel.x = contentX;
    hackingLabel.y = currentY;
    this.addChild(hackingLabel);

    const hackingDesc = new Text({
      text: '(增加网吧收益50%)',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 12, fill: 0x666666 }
    });
    hackingDesc.x = contentX;
    hackingDesc.y = currentY + 25;
    this.addChild(hackingDesc);

    // Hacking checkbox using SimpleCheckbox
    this.hackingCheckbox = new SimpleCheckbox(state.hackingEnabled);
    this.hackingCheckbox.x = contentX + 200;
    this.hackingCheckbox.y = currentY;
    this.addChild(this.hackingCheckbox);

    this.hackingCheckbox.onValueChange((checked: boolean) => {
      gameStateManager.setState({ hackingEnabled: checked });
      console.log(`Hacking mode ${checked ? 'enabled' : 'disabled'}`);
    });

    currentY += 100;

    // Divider line
    const divider = new Graphics();
    divider.moveTo(contentX, currentY);
    divider.lineTo(contentX + 420, currentY);
    divider.stroke({ color: 0x444444, width: 1 });
    this.addChild(divider);

    currentY += 30;

    // Buttons
    const newGameButton = createButton('开始新游戏', 160, 40, 0xff4444, () => this.handleNewGame());
    newGameButton.x = contentX + 140;
    newGameButton.y = currentY;
    this.addChild(newGameButton);

    currentY += 70;

    // About section divider
    const aboutDivider = new Graphics();
    aboutDivider.moveTo(contentX, currentY);
    aboutDivider.lineTo(contentX + 420, currentY);
    aboutDivider.stroke({ color: 0x444444, width: 1 });
    this.addChild(aboutDivider);

    currentY += 20;

    // About section title
    const aboutTitle = new Text({
      text: '关于',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    aboutTitle.x = contentX;
    aboutTitle.y = currentY;
    this.addChild(aboutTitle);

    currentY += 30;

    // Version info
    const versionText = new Text({
      text: '北京浮生记 Web版 v1.0.0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0x888888 }
    });
    versionText.x = contentX;
    versionText.y = currentY;
    this.addChild(versionText);

    currentY += 25;

    // GitHub link
    const githubText = new Text({
      text: 'https://github.com/xrdavies/beijing-fushengji-web',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 12, fill: 0x4a9eff }
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

    currentY += 25;

    // Developer link
    const developerText = new Text({
      text: 'https://x.com/xrdavies',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 12, fill: 0x4a9eff }
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
