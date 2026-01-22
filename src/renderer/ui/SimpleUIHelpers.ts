/**
 * Simple UI helpers to replace @pixi/ui components
 * These are lightweight alternatives that work with PixiJS v8
 */

import { Container, Graphics, Text } from 'pixi.js';

/**
 * Simple button with click handler
 * Default height is 48px to meet mobile touch target guidelines
 */
export function createButton(
  text: string,
  width: number,
  height: number = 48,
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
 * Handle size increased for better mobile touch targets
 */
export class SimpleSlider extends Container {
  private bg: Graphics;
  private handle: Graphics;
  private readonly handleRadius: number = 18;
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

    // Background track - made taller for easier touch
    this.bg = new Graphics();
    this.bg.roundRect(0, 10, width, 16, 8);
    this.bg.fill(0x444444);
    this.bg.eventMode = 'static'; // Block events on track
    this.addChild(this.bg);

    // Handle - increased to 18px radius for better touch
    this.handle = new Graphics();
    this.handle.circle(0, 0, this.handleRadius);
    this.handle.fill(0x3a7bc8);
    this.handle.y = 18;
    this.handle.eventMode = 'static';
    this.handle.cursor = 'pointer';
    this.addChild(this.handle);

    this.updateHandlePosition();
    this.setupInteraction();
  }

  private setupInteraction(): void {
    const updateFromGlobal = (globalX: number) => {
      const usableWidth = this.sliderWidth - this.handleRadius * 2;
      const minX = this.handleRadius;
      const maxX = this.sliderWidth - this.handleRadius;
      const clampedX = Math.max(minX, Math.min(globalX, maxX));
      const ratio = usableWidth > 0 ? (clampedX - minX) / usableWidth : 0;
      this.currentValue = this.minValue + ratio * (this.maxValue - this.minValue);
      this.updateHandlePosition();
      if (this.onChange) {
        this.onChange(this.currentValue);
      }
    };

    const onDragMove = (event: { global: { x: number; y: number } }) => {
      if (!this.isDragging) {
        return;
      }

      const local = this.toLocal(event.global);
      updateFromGlobal(local.x);
    };

    const stopDrag = () => {
      this.isDragging = false;
    };

    this.handle.on('pointerdown', (event) => {
      this.isDragging = true;
      const local = this.toLocal(event.global);
      updateFromGlobal(local.x);
    });

    this.handle.on('pointerup', stopDrag);
    this.handle.on('pointerupoutside', stopDrag);
    this.handle.on('globalpointermove', onDragMove);
  }

  private updateHandlePosition(): void {
    const range = this.maxValue - this.minValue;
    const ratio = range <= 0 ? 0 : (this.currentValue - this.minValue) / range;
    const usableWidth = this.sliderWidth - this.handleRadius * 2;
    this.handle.x = this.handleRadius + ratio * Math.max(0, usableWidth);
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
 * Compact size for dialogs
 */
export class SimpleCheckbox extends Container {
  private static readonly BOX_SIZE = 28;
  private box: Graphics;
  private checkMark: Text;
  private isChecked: boolean = false;
  private onChange: ((checked: boolean) => void) | null = null;

  constructor(initialValue: boolean = false) {
    super();
    this.isChecked = initialValue;
    this.eventMode = 'static';
    this.cursor = 'pointer';

    const boxSize = SimpleCheckbox.BOX_SIZE;

    // Box background
    this.box = new Graphics();
    this.box.roundRect(0, 0, boxSize, boxSize, 4);
    this.box.fill(this.isChecked ? 0x3a7bc8 : 0x444444);
    this.addChild(this.box);

    // Check mark
    this.checkMark = new Text({
      text: '✓',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: 'bold',
      }
    });
    this.checkMark.anchor.set(0.5);
    this.checkMark.x = boxSize / 2;
    this.checkMark.y = boxSize / 2 + 1;
    this.checkMark.visible = this.isChecked;
    this.addChild(this.checkMark);

    this.on('pointerdown', () => this.toggle());
  }

  private toggle(): void {
    this.isChecked = !this.isChecked;
    this.box.clear();
    this.box.roundRect(0, 0, SimpleCheckbox.BOX_SIZE, SimpleCheckbox.BOX_SIZE, 4);
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
