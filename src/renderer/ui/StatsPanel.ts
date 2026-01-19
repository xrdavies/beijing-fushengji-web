/**
 * Stats Panel - Displays player statistics
 *
 * Shows:
 * - Health (with color coding)
 * - Cash
 * - Debt (red)
 * - Bank
 * - Fame (with color coding)
 * - Time Remaining (X/40天)
 * - Capacity (current/max)
 */

import { Container, Graphics, Text, FillGradient } from 'pixi.js';
import type { GameState } from '@engine/types';

export class StatsPanel extends Container {
  private healthText: Text;
  private cashText: Text;
  private debtText: Text;
  private bankText: Text;
  private fameText: Text;
  private timeText: Text;
  private capacityText: Text;
  private playerNameText: Text;

  constructor(width: number = 200, height: number = 300) {
    super();

    // Background
    const background = new Graphics();
    const panelGradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: 0x262d36 },
        { offset: 1, color: 0x1d232b },
      ],
      textureSpace: 'local',
    });
    background.roundRect(0, 0, width, height, 12);
    background.fill(panelGradient);
    background.stroke({ width: 1, color: 0x2f3842 });
    this.addChild(background);

    const headerRule = new Graphics();
    headerRule.moveTo(12, 42);
    headerRule.lineTo(width - 12, 42);
    headerRule.stroke({ width: 1, color: 0x2f3842 });
    this.addChild(headerRule);

    // Title
    const title = new Text({
      text: '玩家状态',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 17,
        fill: 0xf8fafc,
        fontWeight: 'bold',
      }
    });
    title.x = 12;
    title.y = 10;
    this.addChild(title);

    // Create stat labels and values
    let yPos = 54;
    const lineHeight = 30;

    // Player name
    this.playerNameText = new Text({
      text: '玩家: 无名小卒',
      style: {
        fontFamily: 'Microsoft YaHei, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
        fontSize: 14,
        fill: 0xcbd5f5,
      }
    });
    this.playerNameText.x = 12;
    this.playerNameText.y = yPos;
    this.addChild(this.playerNameText);
    yPos += lineHeight;

    // Health
    this.healthText = this.createStatText('健康:', '100', 0x00ff00, 12, yPos);
    this.addChild(this.healthText);
    yPos += lineHeight;

    // Cash
    this.cashText = this.createStatText('现金:', '¥2,000', 0xffdd00, 12, yPos);
    this.addChild(this.cashText);
    yPos += lineHeight;

    // Debt (red)
    this.debtText = this.createStatText('债务:', '¥5,000', 0xff4444, 12, yPos);
    this.addChild(this.debtText);
    yPos += lineHeight;

    // Bank
    this.bankText = this.createStatText('存款:', '¥0', 0x44ff44, 12, yPos);
    this.addChild(this.bankText);
    yPos += lineHeight;

    // Fame
    this.fameText = this.createStatText('声望:', '100', 0xaaaaaa, 12, yPos);
    this.addChild(this.fameText);
    yPos += lineHeight;

    // Time
    this.timeText = this.createStatText('时间:', '40/40天', 0xffffff, 12, yPos);
    this.addChild(this.timeText);
    yPos += lineHeight;

    // Capacity
    this.capacityText = this.createStatText('容量:', '0/100', 0xaaaaaa, 12, yPos);
    this.addChild(this.capacityText);
  }

  /**
   * Create a stat text label with value
   */
  private createStatText(label: string, value: string, color: number, x: number, y: number): Text {
    const text = new Text({
      text: `${label} ${value}`,
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 14,
        fill: color,
      }
    });
    text.x = x;
    text.y = y;
    return text;
  }

  /**
   * Update panel with new game state
   */
  update(state: GameState): void {
    // Health (color code: green if >= 60, yellow if >= 30, red if < 30)
    const healthColor = state.health >= 60 ? 0x00ff00 : state.health >= 30 ? 0xffaa00 : 0xff4444;
    this.healthText.text = `健康: ${state.health}`;
    this.healthText.style.fill = healthColor;

    // Cash
    this.cashText.text = `现金: ¥${state.cash.toLocaleString('zh-CN')}`;

    // Debt (always red)
    this.debtText.text = `债务: ¥${state.debt.toLocaleString('zh-CN')}`;

    // Bank
    this.bankText.text = `存款: ¥${state.bank.toLocaleString('zh-CN')}`;

    // Fame (color code: green if >= 60, gray if < 60)
    const fameColor = state.fame >= 60 ? 0x44ff44 : 0xaaaaaa;
    this.fameText.text = `声望: ${state.fame}`;
    this.fameText.style.fill = fameColor;

    // Time (color code: red if <= 5 days, yellow if <= 10, white otherwise)
    const timeColor = state.timeLeft <= 5 ? 0xff4444 : state.timeLeft <= 10 ? 0xffaa00 : 0xffffff;
    this.timeText.text = `时间: ${state.timeLeft}/40天`;
    this.timeText.style.fill = timeColor;

    // Capacity (calculate current items)
    const currentItems = state.inventory.reduce((sum, item) => sum + item.quantity, 0);
    const capacityColor = currentItems >= state.capacity * 0.9 ? 0xff4444 : 0xaaaaaa;
    this.capacityText.text = `容量: ${currentItems}/${state.capacity}`;
    this.capacityText.style.fill = capacityColor;

    // Player name
    this.playerNameText.text = `玩家: ${state.playerName || '无名小卒'}`;
  }
}
