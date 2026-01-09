/**
 * Simple UI helpers to replace @pixi/ui components
 * These are lightweight alternatives that work with PixiJS v8
 */

import { Container, Graphics, Text } from 'pixi.js';

/**
 * Simple button with click handler
 */
export function createButton(
  text: string,
  width: number,
  height: number,
  color: number = 0x3a7bc8,
  onClick: () => void
): Container {
  const container = new Container();
  container.eventMode = 'static';
  container.cursor = 'pointer';

  const bg = new Graphics();
  bg.roundRect(0, 0, width, height, 5);
  bg.fill(color);
  container.addChild(bg);

  const buttonText = new Text({
    text,
    style: {
      fontFamily: 'Microsoft YaHei, Arial',
      fontSize: 16,
      fill: 0xffffff,
      fontWeight: 'bold',
    }
  });
  buttonText.anchor.set(0.5);
  buttonText.x = width / 2;
  buttonText.y = height / 2;
  container.addChild(buttonText);

  container.on('pointerdown', onClick);

  return container;
}

/**
 * Simple slider with value callback
 */
export class SimpleSlider extends Container {
  private bg: Graphics;
  private handle: Graphics;
  private minValue: number;
  private maxValue: number;
  private currentValue: number;
  private sliderWidth: number;
  private isDragging: boolean = false;
  private onChange: ((value: number) => void) | null = null;

  constructor(width: number, min: number, max: number, initialValue: number = 0) {
    super();
    this.sliderWidth = width;
    this.minValue = min;
    this.maxValue = max;
    this.currentValue = initialValue;

    // CRITICAL: Slider container must block events
    this.eventMode = 'static';

    // Background track
    this.bg = new Graphics();
    this.bg.roundRect(0, 5, width, 10, 5);
    this.bg.fill(0x444444);
    this.bg.eventMode = 'static'; // Block events on track
    this.addChild(this.bg);

    // Handle
    this.handle = new Graphics();
    this.handle.circle(0, 0, 10);
    this.handle.fill(0x3a7bc8);
    this.handle.y = 10;
    this.handle.eventMode = 'static';
    this.handle.cursor = 'pointer';
    this.addChild(this.handle);

    this.updateHandlePosition();
    this.setupInteraction();
  }

  private setupInteraction(): void {
    this.handle.on('pointerdown', () => {
      this.isDragging = true;
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isDragging && this.handle.parent) {
        const localX = e.clientX - this.handle.parent.worldTransform.tx;
        const clampedX = Math.max(0, Math.min(localX, this.sliderWidth));
        const ratio = clampedX / this.sliderWidth;
        this.currentValue = this.minValue + ratio * (this.maxValue - this.minValue);
        this.updateHandlePosition();
        if (this.onChange) {
          this.onChange(this.currentValue);
        }
      }
    });
  }

  private updateHandlePosition(): void {
    const ratio = (this.currentValue - this.minValue) / (this.maxValue - this.minValue);
    this.handle.x = ratio * this.sliderWidth;
  }

  public setValue(value: number): void {
    this.currentValue = Math.max(this.minValue, Math.min(value, this.maxValue));
    this.updateHandlePosition();
  }

  public getValue(): number {
    return this.currentValue;
  }

  public setMax(max: number): void {
    this.maxValue = max;
    this.updateHandlePosition();
  }

  public onValueChange(callback: (value: number) => void): void {
    this.onChange = callback;
  }
}

/**
 * Simple checkbox with toggle callback
 */
export class SimpleCheckbox extends Container {
  private box: Graphics;
  private checkMark: Text;
  private isChecked: boolean = false;
  private onChange: ((checked: boolean) => void) | null = null;

  constructor(initialValue: boolean = false) {
    super();
    this.isChecked = initialValue;
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Box background
    this.box = new Graphics();
    this.box.roundRect(0, 0, 30, 30, 5);
    this.box.fill(this.isChecked ? 0x3a7bc8 : 0x444444);
    this.addChild(this.box);

    // Check mark
    this.checkMark = new Text({
      text: '✓',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xffffff,
        fontWeight: 'bold',
      }
    });
    this.checkMark.x = 7;
    this.checkMark.y = 2;
    this.checkMark.visible = this.isChecked;
    this.addChild(this.checkMark);

    this.on('pointerdown', () => this.toggle());
  }

  private toggle(): void {
    this.isChecked = !this.isChecked;
    this.box.clear();
    this.box.roundRect(0, 0, 30, 30, 5);
    this.box.fill(this.isChecked ? 0x3a7bc8 : 0x444444);
    this.checkMark.visible = this.isChecked;

    if (this.onChange) {
      this.onChange(this.isChecked);
    }
  }

  public setChecked(checked: boolean): void {
    if (this.isChecked !== checked) {
      this.toggle();
    }
  }

  public getChecked(): boolean {
    return this.isChecked;
  }

  public onValueChange(callback: (checked: boolean) => void): void {
    this.onChange = callback;
  }
}
