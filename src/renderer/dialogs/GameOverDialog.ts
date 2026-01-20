/**
 * GameOverDialog - Game over dialog with score and play again option
 *
 * Features:
 * - Final score display
 * - Assets summary (cash + bank - debt)
 * - Performance rating
 * - Play again button
 * - View leaderboard button
 */

import { Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { gameStateManager } from '@state/GameStateManager';
import { createButton } from '../ui/SimpleUIHelpers';
import { trackEvent } from '@utils/analytics';
import { submitScore } from '@utils/leaderboard';
import type { GameState } from '@engine/types';

export class GameOverDialog extends BaseDialog {
  private scoreText!: Text;
  private assetsText!: Text;
  private ratingText!: Text;

  private finalScore: number = 0;
  private onShowLeaderboard?: () => void;

  constructor() {
    super(500, 500, '游戏结束');
    this.createGameOverDialogUI();
  }

  setLeaderboardHandler(handler: () => void): void {
    this.onShowLeaderboard = handler;
  }

  /**
   * Create game over dialog UI components
   */
  private createGameOverDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 100;

    // Game over message
    const gameOverText = new Text({
      text: '40天已到！',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 24,
        fill: 0xffaa00,
        fontWeight: 'bold'
      }
    });
    gameOverText.x = contentX + 210;
    gameOverText.y = currentY;
    gameOverText.anchor.set(0.5, 0);
    this.addChild(gameOverText);

    currentY += 60;

    // Final score
    const scoreLabel = new Text({
      text: '最终得分:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 18, fill: 0xaaaaaa }
    });
    scoreLabel.x = contentX + 80;
    scoreLabel.y = currentY;
    this.addChild(scoreLabel);

    this.scoreText = new Text({
      text: '¥0',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 24,
        fill: 0x00ff00,
        fontWeight: 'bold'
      }
    });
    this.scoreText.x = contentX + 210;
    this.scoreText.y = currentY - 5;
    this.addChild(this.scoreText);

    currentY += 60;

    // Assets breakdown
    this.assetsText = new Text({
      text: '',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 14,
        fill: 0xaaaaaa,
        align: 'center',
        lineHeight: 22,
      }
    });
    this.assetsText.x = contentX + 210;
    this.assetsText.y = currentY;
    this.assetsText.anchor.set(0.5, 0);
    this.addChild(this.assetsText);

    currentY += 100;

    // Rating
    const ratingLabel = new Text({
      text: '评价:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa }
    });
    ratingLabel.x = contentX + 100;
    ratingLabel.y = currentY;
    this.addChild(ratingLabel);

    this.ratingText = new Text({
      text: '',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 18,
        fill: 0xffaa00,
        fontWeight: 'bold'
      }
    });
    this.ratingText.x = contentX + 210;
    this.ratingText.y = currentY - 2;
    this.addChild(this.ratingText);

    currentY += 60;

    // Buttons
    const playAgainButton = createButton('再玩一次', 140, 40, 0x00aa00, () => this.handlePlayAgain());
    playAgainButton.x = contentX + 80;
    playAgainButton.y = currentY;
    this.addChild(playAgainButton);

    const leaderboardButton = createButton('查看排行榜', 140, 40, 0x3a7bc8, () => this.handleViewLeaderboard());
    leaderboardButton.x = contentX + 250;
    leaderboardButton.y = currentY;
    this.addChild(leaderboardButton);
  }

  /**
   * Calculate rating based on score
   */
  private calculateRating(score: number): string {
    if (score >= 10000000) return '亿万富豪！';
    if (score >= 5000000) return '千万富翁！';
    if (score >= 1000000) return '百万富翁！';
    if (score >= 500000) return '成功人士';
    if (score >= 100000) return '小有成就';
    if (score >= 0) return '努力中...';
    if (score >= -100000) return '负债累累';
    return '破产了...';
  }

  /**
   * Handle play again button
   */
  private handlePlayAgain(): void {
    // Note: resetGame() is called in onClose(), no need to call it here
    this.hide();
  }

  /**
   * Handle view leaderboard button
   */
  private handleViewLeaderboard(): void {
    this.hide();
    if (this.onShowLeaderboard) {
      this.onShowLeaderboard();
    }
  }

  /**
   * Open game over dialog (alias for openWithScore)
   */
  open(): void {
    this.openWithScore();
  }

  /**
   * Open game over dialog with final score
   */
  openWithScore(): void {
    const state = gameStateManager.getState();

    // Calculate final score: cash + bank - debt
    this.finalScore = state.cash + state.bank - state.debt;

    trackEvent('game_over', {
      score: this.finalScore,
      cash: state.cash,
      bank: state.bank,
      debt: state.debt,
      time_left: state.timeLeft,
      city: state.city,
    });

    // Update UI
    this.scoreText.text = `¥${this.finalScore.toLocaleString('zh-CN')}`;

    // Assets breakdown
    const breakdown = [
      `现金: ¥${state.cash.toLocaleString('zh-CN')}`,
      `存款: ¥${state.bank.toLocaleString('zh-CN')}`,
      `债务: -¥${state.debt.toLocaleString('zh-CN')}`,
    ];
    this.assetsText.text = breakdown.join('\n');

    // Rating
    const rating = this.calculateRating(this.finalScore);
    this.ratingText.text = rating;

    // Color code score
    if (this.finalScore >= 1000000) {
      this.scoreText.style.fill = 0xffaa00; // Gold for millionaires
    } else if (this.finalScore >= 0) {
      this.scoreText.style.fill = 0x00ff00; // Green for profit
    } else {
      this.scoreText.style.fill = 0xff4444; // Red for debt
    }

    this.show();
    void this.submitFinalScore(state);
  }

  protected onOpen(): void {
    console.log(`Game over! Final score: ¥${this.finalScore.toLocaleString('zh-CN')}`);
  }

  protected onClose(): void {
    // Auto-restart game when dialog closes (Option A)
    // This ensures player always returns to playable state
    // Triggered by: X button, ESC key, or any dialog close
    gameStateManager.resetGame();
    console.log('Game over dialog closed - Starting new game');
  }

  private async submitFinalScore(state: GameState): Promise<void> {
    const playerName = state.playerName?.trim() || '无名小卒';
    const record = await submitScore({
      playerName,
      totalWealth: this.finalScore,
      cash: state.cash,
      bank: state.bank,
      debt: state.debt,
      health: state.health,
      fame: state.fame,
    });

    if (record) {
      trackEvent('score_submitted', { total_wealth: record.totalWealth });
    } else {
      trackEvent('score_submit_failed', { reason: 'network' });
    }
  }
}
