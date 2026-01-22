/**
 * WangbaDialog - Internet cafe dialog with mini-game
 *
 * Features:
 * - Visit counter display
 * - Random cash reward (based on hacking skill)
 * - "Hacking" toggle (affects reward amount)
 * - Simulates random internet browsing activities
 */

import { Container, Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { audioManager } from '@audio/AudioManager';
import { GAME_CONSTANTS } from '@engine/types';
import { gameStateManager } from '@state/GameStateManager';
import { randomInt } from '@utils/random';
import { createButton } from '../ui/SimpleUIHelpers';

export class WangbaDialog extends BaseDialog {
  private visitsText!: Text;
  private resultText!: Text;
  private rewardText!: Text;
  private playButton!: Container;
  private playButtonText: Text | null = null;

  private visits: number = 0;
  private reward: number = 0;
  private readonly playButtonWidth: number = 170;
  private readonly playButtonHeight: number = 40;
  private readonly playButtonLabel: string =
    `开始上网 (¥${GAME_CONSTANTS.WANGBA_ENTRY_COST.toLocaleString('zh-CN')})`;

  constructor() {
    super(500, 400, '黑网吧');
    this.doorSoundsEnabled = true;
    this.createWangbaDialogUI();
  }

  /**
   * Create wangba dialog UI components
   */
  private createWangbaDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 80;

    // Description
    const description = new Text({
      text: '欢迎来到全国最大的黑网吧！试试运气看能不能赚点钱...',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa }
    });
    description.x = contentX;
    description.y = currentY;
    this.addChild(description);

    currentY += 32;

    const costText = new Text({
      text: `上网费用: ¥${GAME_CONSTANTS.WANGBA_ENTRY_COST.toLocaleString('zh-CN')} / 次 (最多${GAME_CONSTANTS.MAX_WANGBA_VISITS}次)`,
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 12, fill: 0x888888 }
    });
    costText.x = contentX;
    costText.y = currentY;
    this.addChild(costText);

    currentY += 28;

    // Visits counter
    const visitsLabel = new Text({
      text: '访问次数:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    visitsLabel.x = contentX;
    visitsLabel.y = currentY;
    this.addChild(visitsLabel);

    this.visitsText = new Text({
      text: '0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffaa00, fontWeight: 'bold' }
    });
    this.visitsText.x = contentX + 120;
    this.visitsText.y = currentY;
    this.addChild(this.visitsText);

    currentY += 60;

    // Result text (shows what happened)
    this.resultText = new Text({
      text: '点击"开始上网"按钮试试运气...',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 14,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 420,
        align: 'center'
      }
    });
    this.resultText.x = contentX + 210;
    this.resultText.y = currentY;
    this.resultText.anchor.set(0.5, 0);
    this.addChild(this.resultText);

    currentY += 80;

    // Reward text
    this.rewardText = new Text({
      text: '',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 20,
        fill: 0x00ff00,
        fontWeight: 'bold'
      }
    });
    this.rewardText.x = contentX + 210;
    this.rewardText.y = currentY;
    this.rewardText.anchor.set(0.5, 0);
    this.addChild(this.rewardText);

    currentY += 60;

    // Buttons
    this.playButton = createButton(
      this.playButtonLabel,
      this.playButtonWidth,
      this.playButtonHeight,
      0x3a7bc8,
      () => this.handlePlay()
    );
    this.playButton.x = contentX + 75;
    this.playButton.y = currentY;
    this.addChild(this.playButton);
    this.playButtonText = this.playButton.children.find(
      (child) => child instanceof Text
    ) as Text | undefined || null;

    const closeButton = createButton('离开', 100, 40, 0x666666, () => this.hide());
    closeButton.x = contentX + 250;
    closeButton.y = currentY;
    this.addChild(closeButton);
  }

  /**
   * Handle play button - simulate internet activity
   */
  private handlePlay(): void {
    audioManager.play('keyboard');

    // Random activities
    const activities = [
      { text: '你浏览了一些网页，偶然发现了一个红包！', minReward: 50, maxReward: 200 },
      { text: '你在论坛上帮人解决了技术问题，收到了打赏！', minReward: 100, maxReward: 500 },
      { text: '你玩了会儿游戏，运气不错赢了点钱！', minReward: 20, maxReward: 150 },
      { text: '你发现了一个测试漏洞并报告，获得了奖励！', minReward: 200, maxReward: 1000 },
      { text: '你在网上做了个调查问卷，得到了小额奖励。', minReward: 10, maxReward: 50 },
    ];

    // Select random activity
    const activity = activities[randomInt(activities.length)];

    // Update state with selected reward range
    const result = gameStateManager.visitWangba(activity.minReward, activity.maxReward);

    if (result.success) {
      const updatedState = gameStateManager.getState();
      this.visits = updatedState.wangbaVisits;
      this.visitsText.text = this.visits.toString();
      this.resultText.text = activity.text;
      this.reward = result.value;
      this.rewardText.text = `+¥${this.reward.toLocaleString('zh-CN')}`;

      console.log(`Wangba visit #${this.visits}: gained ¥${this.reward}`);
    } else {
      this.resultText.text = result.error;
      this.rewardText.text = '';
    }

    this.updatePlayButtonState();
  }

  /**
   * Open wangba dialog
   */
  open(): void {
    // CRITICAL: Prevent opening if game is over (time up OR player dead)
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot open wangba');

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
    this.visits = state.wangbaVisits;

    // Update UI
    this.visitsText.text = this.visits.toString();
    this.resultText.text = '点击"开始上网"按钮试试运气...';
    this.rewardText.text = '';
    this.updatePlayButtonState();

    this.show();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }

  private updatePlayButtonState(): void {
    const state = gameStateManager.getState();
    const hasVisits = state.wangbaVisits < GAME_CONSTANTS.MAX_WANGBA_VISITS;
    const hasCash = state.cash >= GAME_CONSTANTS.WANGBA_ENTRY_COST;
    const enabled = hasVisits && hasCash;

    if (!this.playButton) {
      return;
    }

    this.playButton.eventMode = enabled ? 'static' : 'none';
    this.playButton.cursor = enabled ? 'pointer' : 'default';
    this.playButton.alpha = enabled ? 1 : 0.55;

    if (this.playButtonText) {
      if (enabled) {
        this.playButtonText.text = this.playButtonLabel;
      } else if (!hasVisits) {
        this.playButtonText.text = '老板不让进';
      } else {
        this.playButtonText.text = '没钱了';
      }
      this.playButtonText.x = this.playButtonWidth / 2;
    }
  }
}
