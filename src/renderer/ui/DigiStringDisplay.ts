/**
 * DigiString Display - LED-style numeric display
 *
 * Features:
 * - LED-style monospace font
 * - Color coding (green=gain, red=loss, white=neutral)
 * - Value change animations (optional)
 */

import { Container, Text } from 'pixi.js';

export type DigiStringColor = 'green' | 'red' | 'white' | 'yellow';

export class DigiStringDisplay extends Container {
  private text: Text;
  private currentValue: number = 0;

  constructor(initialValue: number = 0, color: DigiStringColor = 'white') {
    super();

    this.currentValue = initialValue;

    // Create text with LED-style font
    this.text = new Text({
      text: this.formatValue(initialValue),
      style: {
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        fontSize: 16,
        fill: this.getColor(color),
        fontWeight: 'bold',
      }
    });

    this.addChild(this.text);
  }

  /**
   * Set value with optional color
   */
  setValue(value: number, color?: DigiStringColor): void {
    this.currentValue = value;
    this.text.text = this.formatValue(value);

    if (color) {
      this.text.style.fill = this.getColor(color);
    }
  }

  /**
   * Set value with automatic color coding based on change
   */
  setValueWithChange(newValue: number, oldValue: number): void {
    this.currentValue = newValue;
    this.text.text = this.formatValue(newValue);

    // Auto color code based on change
    if (newValue > oldValue) {
      this.text.style.fill = this.getColor('green'); // Gain
    } else if (newValue < oldValue) {
      this.text.style.fill = this.getColor('red'); // Loss
    } else {
      this.text.style.fill = this.getColor('white'); // No change
    }
  }

  /**
   * Format value with Chinese number formatting
   */
  private formatValue(value: number): string {
    if (value >= 10000) {
      const wan = Math.floor(value / 10000);
      const remainder = value % 10000;
      if (remainder === 0) {
        return `${wan}万`;
      } else {
        return `${wan}.${Math.floor(remainder / 1000)}万`;
      }
    }
    return value.toLocaleString('zh-CN');
  }

  /**
   * Get color hex value
   */
  private getColor(color: DigiStringColor): number {
    switch (color) {
      case 'green':
        return 0x00ff00;
      case 'red':
        return 0xff4444;
      case 'yellow':
        return 0xffdd00;
      case 'white':
      default:
        return 0xffffff;
    }
  }

  /**
   * Get current value
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * Set color
   */
  setColor(color: DigiStringColor): void {
    this.text.style.fill = this.getColor(color);
  }

  /**
   * Set font size
   */
  setFontSize(size: number): void {
    this.text.style.fontSize = size;
  }
}
