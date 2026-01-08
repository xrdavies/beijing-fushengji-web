/**
 * AnimatedNumber - Animated number display that smoothly transitions between values
 *
 * Features:
 * - Smooth number counting animation
 * - Color-coded changes (green for increase, red for decrease)
 * - Configurable duration and easing
 */

import { Text } from 'pixi.js';

export class AnimatedNumber {
  private text: Text;
  private currentValue: number = 0;
  private targetValue: number = 0;
  private animationStartTime: number = 0;
  private animationDuration: number = 500; // ms
  private isAnimating: boolean = false;

  constructor(text: Text) {
    this.text = text;
  }

  /**
   * Set target value with animation
   */
  setValue(value: number, immediate: boolean = false): void {
    if (immediate) {
      this.currentValue = value;
      this.targetValue = value;
      this.updateDisplay(value);
      return;
    }

    // Start animation if value changed
    if (value !== this.targetValue) {
      this.targetValue = value;
      this.animationStartTime = Date.now();
      this.isAnimating = true;

      // Flash color based on change direction
      const oldValue = this.currentValue;
      if (value > oldValue) {
        this.flashColor(0x00ff00); // Green for increase
      } else if (value < oldValue) {
        this.flashColor(0xff4444); // Red for decrease
      }

      this.animate();
    }
  }

  /**
   * Animate number transition
   */
  private animate(): void {
    if (!this.isAnimating) return;

    const elapsed = Date.now() - this.animationStartTime;
    const progress = Math.min(elapsed / this.animationDuration, 1);

    // Easing: ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);

    // Interpolate value
    const startValue = this.currentValue;
    const diff = this.targetValue - startValue;
    const displayValue = Math.floor(startValue + diff * eased);

    this.updateDisplay(displayValue);

    if (progress < 1) {
      requestAnimationFrame(() => this.animate());
    } else {
      // Animation complete
      this.currentValue = this.targetValue;
      this.isAnimating = false;
      this.updateDisplay(this.targetValue);
    }
  }

  /**
   * Update text display
   */
  private updateDisplay(value: number): void {
    const prefix = this.text.text.match(/^[¥]/)?.[0] || '';
    this.text.text = `${prefix}${value.toLocaleString('zh-CN')}`;
  }

  /**
   * Flash color briefly
   */
  private flashColor(color: number): void {
    const originalColor = this.text.style.fill as number;
    this.text.style.fill = color;

    setTimeout(() => {
      this.text.style.fill = originalColor;
    }, 300);
  }

  /**
   * Get current displayed value
   */
  getValue(): number {
    return this.currentValue;
  }
}
