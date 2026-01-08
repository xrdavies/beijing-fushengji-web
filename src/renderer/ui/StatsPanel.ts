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

import { Container, Graphics, Text } from 'pixi.js';
import type { GameState } from '@engine/types';

export class StatsPanel extends Container {
  private healthText: Text;
  private cashText: Text;
  private debtText: Text;
  private bankText: Text;
  private fameText: Text;
  private timeText: Text;
  private capacityText: Text;

  constructor(width: number = 200, height: number = 300) {
    super();

    // Background
    const background = new Graphics();
    background.roundRect(0, 0, width, height, 10);
    background.fill(0x2c2c2c);
    background.stroke({ width: 2, color: 0x444444 });
    this.addChild(background);

    // Title
    const title = new Text({
      text: '玩家状态',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: 'bold',
      }
    });
    title.x = 10;
    title.y = 10;
    this.addChild(title);

    // Create stat labels and values
    let yPos = 50;
    const lineHeight = 35;

    // Health
    this.healthText = this.createStatText('健康:', '100', 0x00ff00, 10, yPos);
    this.addChild(this.healthText);
    yPos += lineHeight;

    // Cash
    this.cashText = this.createStatText('现金:', '¥2,000', 0xffdd00, 10, yPos);
    this.addChild(this.cashText);
    yPos += lineHeight;

    // Debt (red)
    this.debtText = this.createStatText('债务:', '¥5,000', 0xff4444, 10, yPos);
    this.addChild(this.debtText);
    yPos += lineHeight;

    // Bank
    this.bankText = this.createStatText('存款:', '¥0', 0x44ff44, 10, yPos);
    this.addChild(this.bankText);
    yPos += lineHeight;

    // Fame
    this.fameText = this.createStatText('声望:', '100', 0xaaaaaa, 10, yPos);
    this.addChild(this.fameText);
    yPos += lineHeight;

    // Time
    this.timeText = this.createStatText('时间:', '40/40天', 0xffffff, 10, yPos);
    this.addChild(this.timeText);
    yPos += lineHeight;

    // Capacity
    this.capacityText = this.createStatText('容量:', '0/100', 0xaaaaaa, 10, yPos);
    this.addChild(this.capacityText);
  }

  /**
   * Create a stat text label with value
   */
  private createStatText(label: string, value: string, color: number, x: number, y: number): Text {
    const text = new Text({
      text: `${label} ${value}`,
      style: {
        fontFamily: 'Microsoft YaHei, Consolas, Arial',
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
  }
}
