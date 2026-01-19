/**
 * TravelDialog - Location and city selection dialog
 *
 * Features:
 * - List of Beijing locations (10)
 * - List of Shanghai locations (10)
 * - City switching (costs airplane ticket)
 * - Current location highlight
 * - Time cost display
 */

import { Container, Graphics, Text } from 'pixi.js';
import { ScrollBox } from '@pixi/ui';
import { BaseDialog } from './BaseDialog';
import { gameStateManager } from '@state/GameStateManager';
import { gameEngine } from '@engine/GameEngine';
import { BEIJING_LOCATIONS, SHANGHAI_LOCATIONS, type Location } from '@engine/types';
import { createButton } from '../ui/SimpleUIHelpers';
import { EventQueue } from '../ui/EventQueue';
import { audioManager } from '@audio/AudioManager';

export class TravelDialog extends BaseDialog {
  private beijingScrollBox!: ScrollBox;
  private shanghaiScrollBox!: ScrollBox;
  private locationLabelText!: Text;
  private currentCityText!: Text;
  private locationSeparatorText!: Text;
  private currentLocationText!: Text;
  private timeLeftText!: Text;
  private eventQueue: EventQueue;

  constructor(eventQueue: EventQueue) {
    super(600, 500, '旅行');
    this.eventQueue = eventQueue;
    this.createTravelDialogUI();
  }

  /**
   * Create travel dialog UI components
   */
  private createTravelDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 30;
    let currentY = panelY + 80;

    const listWidth = 250;
    const listHeight = 250;
    const listPadding = 10;
    const itemWidth = listWidth - listPadding * 2;

    // Current status
    const statusContainer = new Container();
    statusContainer.x = contentX;
    statusContainer.y = currentY;

    this.locationLabelText = new Text({
      text: '当前位置:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa }
    });
    this.locationLabelText.x = 0;
    this.locationLabelText.y = 0;
    statusContainer.addChild(this.locationLabelText);

    this.currentCityText = new Text({
      text: '北京',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xffaa00, fontWeight: 'bold' }
    });
    this.currentCityText.y = 0;
    statusContainer.addChild(this.currentCityText);

    this.locationSeparatorText = new Text({
      text: '*',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.locationSeparatorText.y = 0;
    statusContainer.addChild(this.locationSeparatorText);

    this.currentLocationText = new Text({
      text: '未知',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' }
    });
    this.currentLocationText.y = 0;
    statusContainer.addChild(this.currentLocationText);

    const timeLeftLabel = new Text({
      text: '剩余时间:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa }
    });
    timeLeftLabel.x = 200;
    timeLeftLabel.y = 0;
    statusContainer.addChild(timeLeftLabel);

    this.timeLeftText = new Text({
      text: '40天',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0x00ff00, fontWeight: 'bold' }
    });
    this.timeLeftText.x = 290;
    this.timeLeftText.y = 0;
    statusContainer.addChild(this.timeLeftText);

    this.layoutLocationDisplay();

    this.addChild(statusContainer);

    currentY += 60;

    // Beijing section
    const beijingTitle = new Text({
      text: '北京 (本地旅行)',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffffff, fontWeight: 'bold' }
    });
    beijingTitle.x = contentX;
    beijingTitle.y = currentY;
    this.addChild(beijingTitle);

    currentY += 30;

    // Beijing locations ScrollBox
    this.beijingScrollBox = new ScrollBox({
      width: listWidth,
      height: listHeight,
      background: 0x1a1a1a,
      radius: 5,
      type: 'vertical',
      padding: listPadding,
      elementsMargin: 8,
    });
    this.beijingScrollBox.x = contentX;
    this.beijingScrollBox.y = currentY;
    this.addChild(this.beijingScrollBox);

    // Populate Beijing locations
    this.populateLocations(this.beijingScrollBox, BEIJING_LOCATIONS, itemWidth);

    // Shanghai section
    const shanghaiTitle = new Text({
      text: '上海 (需要机票)',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffffff, fontWeight: 'bold' }
    });
    shanghaiTitle.x = contentX + 280;
    shanghaiTitle.y = currentY - 30;
    this.addChild(shanghaiTitle);

    // Shanghai locations ScrollBox
    this.shanghaiScrollBox = new ScrollBox({
      width: listWidth,
      height: listHeight,
      background: 0x1a1a1a,
      radius: 5,
      type: 'vertical',
      padding: listPadding,
      elementsMargin: 8,
    });
    this.shanghaiScrollBox.x = contentX + 280;
    this.shanghaiScrollBox.y = currentY;
    this.addChild(this.shanghaiScrollBox);

    // Populate Shanghai locations
    this.populateLocations(this.shanghaiScrollBox, SHANGHAI_LOCATIONS, itemWidth);

    currentY += 270;

    // Close button
    const closeButton = createButton('关闭', 120, 40, 0x666666, () => this.hide());
    closeButton.x = contentX + 215;
    closeButton.y = currentY;
    this.addChild(closeButton);
  }

  /**
   * Populate locations in a scrollbox
   */
  private populateLocations(scrollBox: ScrollBox, locations: Location[], itemWidth: number): void {
    const itemHeight = 36;

    for (const location of locations) {
      const itemContainer = new Container();
      itemContainer.interactive = true;
      itemContainer.cursor = 'pointer';

      // Background
      const background = new Graphics();
      const renderBackground = (color: number) => {
        background.clear();
        background.roundRect(0, 0, itemWidth, itemHeight, 6);
        background.fill(color);
      };
      renderBackground(0x2a2a2a);
      itemContainer.addChild(background);

      // Location name
      const nameText = new Text({
        text: location.name,
        style: {
          fontFamily: 'Microsoft YaHei, Arial',
          fontSize: 14,
          fill: 0xffffff,
        }
      });
      nameText.x = 12;
      nameText.y = Math.round((itemHeight - nameText.height) / 2);
      itemContainer.addChild(nameText);

      // Click handler
      itemContainer.on('pointerdown', () => {
        this.handleLocationSelect(location);
      });

      // Hover effect
      itemContainer.on('pointerover', () => {
        renderBackground(0x3a7bc8);
      });

      itemContainer.on('pointerout', () => {
        renderBackground(0x2a2a2a);
      });

      scrollBox.addItem(itemContainer);
    }
  }

  /**
   * Handle location selection
   */
  private handleLocationSelect(location: Location): void {
    const state = gameStateManager.getState();

    // CRITICAL: Prevent travel if game is over (time up OR player dead)
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot travel');
      this.hide();
      this.eventQueue.enqueue([gameEngine.getGameOverEvent(state)]);
      return;
    }

    // Check if already at this location
    if (state.currentLocation?.id === location.id) {
      console.log('Already at this location');
      return;
    }

    // Check if traveling to Shanghai (requires airplane sound)
    if (location.city === 'shanghai' && state.city === 'beijing') {
      audioManager.play('airport');
    }

    // Trigger location change (this will generate events)
    const events = gameStateManager.changeLocation(location);

    // Close travel dialog
    this.hide();

    this.eventQueue.enqueue(events);
  }

  /**
   * Open travel dialog
   */
  open(): void {
    // CRITICAL: Prevent opening if game is over (time up OR player dead)
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot open travel');
      const state = gameStateManager.getState();
      this.eventQueue.enqueue([gameEngine.getGameOverEvent(state)]);
      return;
    }

    const state = gameStateManager.getState();

    // Update UI
    this.currentCityText.text = state.city === 'beijing' ? '北京' : '上海';
    this.currentLocationText.text = state.currentLocation?.name ?? '未知';
    this.layoutLocationDisplay();
    this.timeLeftText.text = `${state.timeLeft}天`;

    this.show();
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }

  private layoutLocationDisplay(): void {
    const labelGap = 8;
    const separatorGap = 6;
    const labelRight = this.locationLabelText.x + this.locationLabelText.width;

    this.currentCityText.x = labelRight + labelGap;
    this.locationSeparatorText.x = this.currentCityText.x + this.currentCityText.width + separatorGap;
    this.currentLocationText.x =
      this.locationSeparatorText.x + this.locationSeparatorText.width + separatorGap;
  }
}
