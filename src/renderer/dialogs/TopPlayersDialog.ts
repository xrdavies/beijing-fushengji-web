/**
 * TopPlayersDialog - Leaderboard dialog showing top 10 players
 *
 * Features:
 * - Display top 10 player scores
 * - Scrollable list
 * - Rank, name, and score display
 * - Placeholder data (will load from localStorage later)
 */

import { Text, Container } from 'pixi.js';
import { ScrollBox } from '@pixi/ui';
import { BaseDialog } from './BaseDialog';
import { createButton } from '../ui/SimpleUIHelpers';

export interface PlayerScore {
  rank: number;
  name: string;
  score: number;
}

export class TopPlayersDialog extends BaseDialog {
  private scrollBox!: ScrollBox;

  constructor() {
    super(500, 500, '排行榜');
    this.createTopPlayersDialogUI();
  }

  /**
   * Create top players dialog UI components
   */
  private createTopPlayersDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 80;

    // Header
    const headerContainer = new Container();
    headerContainer.x = contentX;
    headerContainer.y = currentY;

    const rankHeader = new Text({
      text: '排名',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    rankHeader.x = 20;
    rankHeader.y = 0;
    headerContainer.addChild(rankHeader);

    const nameHeader = new Text({
      text: '玩家',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    nameHeader.x = 100;
    nameHeader.y = 0;
    headerContainer.addChild(nameHeader);

    const scoreHeader = new Text({
      text: '分数',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    scoreHeader.x = 300;
    scoreHeader.y = 0;
    headerContainer.addChild(scoreHeader);

    this.addChild(headerContainer);

    currentY += 40;

    // Create scrollable list - ScrollBox IS a Container, no .view needed
    this.scrollBox = new ScrollBox({
      width: 420,
      height: 280,
      background: 0x1a1a1a,
      radius: 5,
    });

    this.scrollBox.x = contentX;
    this.scrollBox.y = currentY;
    this.addChild(this.scrollBox);

    currentY += 300;

    // Close button
    const closeButton = createButton('关闭', 120, 40, 0x3a7bc8, () => this.hide());
    closeButton.x = contentX + 150;
    closeButton.y = currentY;
    this.addChild(closeButton);
  }

  /**
   * Populate leaderboard with player scores
   */
  private populateLeaderboard(players: PlayerScore[]): void {
    // Clear existing content
    this.scrollBox.removeItems();

    let yOffset = 10;

    for (const player of players) {
      const rowContainer = new Container();

      // Rank
      const rankText = new Text({
        text: `#${player.rank}`,
        style: {
          fontFamily: 'Microsoft YaHei, Arial',
          fontSize: 16,
          fill: player.rank <= 3 ? 0xffaa00 : 0xffffff,
          fontWeight: player.rank <= 3 ? 'bold' : 'normal'
        }
      });
      rankText.x = 20;
      rankText.y = 0;
      rowContainer.addChild(rankText);

      // Name
      const nameText = new Text({
        text: player.name,
        style: {
          fontFamily: 'Microsoft YaHei, Arial',
          fontSize: 16,
          fill: 0xffffff
        }
      });
      nameText.x = 80;
      nameText.y = 0;
      rowContainer.addChild(nameText);

      // Score
      const scoreText = new Text({
        text: player.score.toLocaleString('zh-CN'),
        style: {
          fontFamily: 'Microsoft YaHei, Arial',
          fontSize: 16,
          fill: 0x00ff00,
          fontWeight: 'bold'
        }
      });
      scoreText.x = 280;
      scoreText.y = 0;
      rowContainer.addChild(scoreText);

      rowContainer.y = yOffset;
      this.scrollBox.addItem(rowContainer);

      yOffset += 35;
    }
  }

  /**
   * Load scores from localStorage
   */
  private loadScores(): PlayerScore[] {
    // TODO: Implement actual localStorage loading
    // For now, return placeholder data
    return [
      { rank: 1, name: '富豪王', score: 5000000 },
      { rank: 2, name: '商业大亨', score: 3500000 },
      { rank: 3, name: '百万富翁', score: 2000000 },
      { rank: 4, name: '成功人士', score: 1500000 },
      { rank: 5, name: '小有成就', score: 1000000 },
      { rank: 6, name: '普通玩家', score: 500000 },
      { rank: 7, name: '努力中', score: 300000 },
      { rank: 8, name: '新手', score: 100000 },
      { rank: 9, name: '菜鸟', score: 50000 },
      { rank: 10, name: '初学者', score: 10000 },
    ];
  }

  /**
   * Open leaderboard dialog
   */
  open(): void {
    const scores = this.loadScores();
    this.populateLeaderboard(scores);
    this.show();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }
}
