/**
 * TopPlayersDialog - Leaderboard dialog showing top 10 players
 *
 * Features:
 * - Display top player scores
 * - Scrollable list
 * - Rank, name, and score display
 */

import { Text, Container } from 'pixi.js';
import { ScrollBox } from '@pixi/ui';
import { BaseDialog } from './BaseDialog';
import { createButton } from '../ui/SimpleUIHelpers';
import { fetchLeaderboard } from '@utils/leaderboard';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const MAX_TEXT_RESOLUTION = 3;

export interface PlayerScore {
  rank: number;
  name: string;
  score: number;
}

export class TopPlayersDialog extends BaseDialog {
  private scrollBox!: ScrollBox;
  private listWidth = 420;
  private listHeight = 300;

  constructor() {
    super(500, 500, '富人榜');
    this.createTopPlayersDialogUI();
  }

  /**
   * Create top players dialog UI components
   */
  private createTopPlayersDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 65;

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
      text: '资产',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa, fontWeight: 'bold' }
    });
    scoreHeader.x = 300;
    scoreHeader.y = 0;
    headerContainer.addChild(scoreHeader);

    this.addChild(headerContainer);

    currentY += 32;

    // Create scrollable list - ScrollBox IS a Container, no .view needed
    this.scrollBox = new ScrollBox({
      width: this.listWidth,
      height: this.listHeight,
      background: 0x1a1a1a,
      radius: 5,
    });

    this.scrollBox.x = contentX;
    this.scrollBox.y = currentY;
    this.addChild(this.scrollBox);

    currentY += this.listHeight + 20;

    // Close button
    const closeButton = createButton('关闭', 120, 40, 0x3a7bc8, () => this.hide());
    closeButton.x = contentX + 150;
    closeButton.y = currentY;
    this.addChild(closeButton);

    this.applyTextResolution(this, this.getTextResolution());
  }

  /**
   * Populate leaderboard with player scores
   */
  private populateLeaderboard(players: PlayerScore[]): void {
    // Clear existing content
    this.scrollBox.removeItems();

    if (players.length === 0) {
      this.setStatus('暂无排行数据');
      return;
    }

    let yOffset = 10;
    const resolution = this.getTextResolution();

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
        text: '¥' + player.score.toLocaleString('zh-CN'),
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
      this.applyTextResolution(rowContainer, resolution);
      this.scrollBox.addItem(rowContainer);

      yOffset += 35;
    }
  }

  /**
   * Open leaderboard dialog
   */
  open(): void {
    this.show();
    void this.refreshLeaderboard();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }

  private setStatus(message: string): void {
    this.scrollBox.removeItems();
    const container = new Container();
    const text = new Text({
      text: message,
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0x94a3b8 }
    });
    text.anchor.set(0.5, 0.5);
    text.x = this.listWidth / 2;
    text.y = this.listHeight / 2;
    container.addChild(text);
    this.applyTextResolution(container, this.getTextResolution());
    this.scrollBox.addItem(container);
  }

  private async refreshLeaderboard(): Promise<void> {
    this.setStatus('加载中...');
    const leaderboard = await fetchLeaderboard();

    if (!leaderboard) {
      this.setStatus('排行榜加载失败');
    } else {
      const players = leaderboard.items.map((item, index) => ({
        rank: index + 1,
        name: item.playerName,
        score: item.totalWealth,
      }));
      this.populateLeaderboard(players);
    }
  }

  private getTextResolution(): number {
    const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
    const devicePixelRatio = window.devicePixelRatio || 1;
    return Math.min(devicePixelRatio * Math.max(1, scale), MAX_TEXT_RESOLUTION);
  }

  private applyTextResolution(container: Container, resolution: number): void {
    for (const child of container.children) {
      if (child instanceof Text) {
        child.resolution = resolution;
        child.roundPixels = true;
      }

      if (child instanceof Container && child.children.length > 0) {
        this.applyTextResolution(child, resolution);
      }
    }
  }
}
