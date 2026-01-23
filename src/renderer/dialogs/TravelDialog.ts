/**
 * TravelDialog - City travel selection dialog
 *
 * Features:
 * - List of cities with flight ticket prices
 * - Current city highlighted and disabled
 * - Time remaining display
 */

import { Container, Graphics, Text } from 'pixi.js';
import { ScrollBox } from '@pixi/ui';
import { BaseDialog } from './BaseDialog';
import { gameStateManager } from '@state/GameStateManager';
import { gameEngine } from '@engine/GameEngine';
import {
  CITY_TRAVEL_OPTIONS,
  getCityLabel,
  type City,
  type CityTravelOption,
} from '@engine/types';
import { createButton } from '../ui/SimpleUIHelpers';
import { EventQueue } from '../ui/EventQueue';
import { audioManager } from '@audio/AudioManager';

export class TravelDialog extends BaseDialog {
  private cityScrollBox!: ScrollBox;
  private cityItemUpdateFns: Map<City, (hovered?: boolean) => void> = new Map();
  private cityLabelText!: Text;
  private currentCityText!: Text;
  private statusContentWidth: number = 0;
  private timeLeftLabelText!: Text;
  private timeLeftText!: Text;
  private cityItemWidth: number = 0;
  private cityColumnGap: number = 0;
  private unsubscribeState: (() => void) | null = null;
  private eventQueue: EventQueue;

  constructor(eventQueue: EventQueue) {
    super(520, 420, '旅行社');
    this.doorSoundsEnabled = true;
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
    let currentY = panelY + 75;

    const contentWidth = this.dialogWidth - 60;
    const listWidth = contentWidth;
    const listHeight = 220;
    const listPadding = 12;
    const columnGap = 16;
    const itemWidth = Math.floor((listWidth - listPadding * 2 - columnGap) / 2);
    this.cityItemWidth = itemWidth;
    this.cityColumnGap = columnGap;
    this.statusContentWidth = contentWidth;

    // Current status
    const statusContainer = new Container();
    statusContainer.x = contentX;
    statusContainer.y = currentY;

    this.cityLabelText = new Text({
      text: '当前城市:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa }
    });
    this.cityLabelText.x = 0;
    this.cityLabelText.y = 0;
    statusContainer.addChild(this.cityLabelText);

    this.currentCityText = new Text({
      text: '北京',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xffaa00, fontWeight: 'bold' }
    });
    this.currentCityText.y = 0;
    statusContainer.addChild(this.currentCityText);

    this.timeLeftLabelText = new Text({
      text: '剩余时间:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa }
    });
    this.timeLeftLabelText.y = 0;
    statusContainer.addChild(this.timeLeftLabelText);

    this.timeLeftText = new Text({
      text: '40天',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0x00ff00, fontWeight: 'bold' }
    });
    this.timeLeftText.y = 0;
    statusContainer.addChild(this.timeLeftText);

    this.layoutStatusDisplay();
    this.addChild(statusContainer);

    currentY += 56;

    // City list ScrollBox
    this.cityScrollBox = new ScrollBox({
      width: listWidth,
      height: listHeight,
      background: 0x1a1a1a,
      radius: 6,
      type: 'vertical',
      padding: listPadding,
      elementsMargin: 10,
    });
    this.cityScrollBox.x = contentX;
    this.cityScrollBox.y = currentY;
    this.addChild(this.cityScrollBox);

    this.populateCities();

    currentY += listHeight + 16;

    // Close button
    const closeButton = createButton('关闭', 120, 40, 0x666666, () => this.hide());
    closeButton.x = panelX + (this.dialogWidth - 120) / 2;
    closeButton.y = currentY;
    this.addChild(closeButton);
  }

  private populateCities(): void {
    this.cityScrollBox.removeItems();
    this.cityItemUpdateFns.clear();

    const textResolution = this.currentCityText?.resolution || window.devicePixelRatio || 1;
    const currentCity = gameStateManager.getState().city;
    const itemHeight = 38;
    const baseColor = 0x2a2a2a;
    const hoverColor = 0x3a7bc8;
    const highlightColor = 0x3a4a66;

    for (let i = 0; i < CITY_TRAVEL_OPTIONS.length; i += 2) {
      const rowContainer = new Container();
      const rowOptions = CITY_TRAVEL_OPTIONS.slice(i, i + 2);

      rowOptions.forEach((option, columnIndex) => {
        const itemContainer = new Container();
        itemContainer.eventMode = 'static';
        itemContainer.cursor = option.city === currentCity ? 'default' : 'pointer';
        itemContainer.x = columnIndex * (this.cityItemWidth + this.cityColumnGap);

        const background = new Graphics();
        const renderBackground = (color: number) => {
          background.clear();
          background.roundRect(0, 0, this.cityItemWidth, itemHeight, 6);
          background.fill(color);
        };
        renderBackground(baseColor);
        itemContainer.addChild(background);

        const nameText = new Text({
          text: option.label,
          style: {
            fontFamily: 'Microsoft YaHei, Arial',
            fontSize: 15,
            fill: 0xffffff,
          }
        });
        nameText.resolution = textResolution;
        nameText.roundPixels = true;
        nameText.x = 12;
        nameText.y = Math.round((itemHeight - nameText.height) / 2);
        itemContainer.addChild(nameText);

        const isCurrent = option.city === currentCity;
        const isAvailable = option.city === 'beijing' || option.city === 'shanghai';
        const costLabel = new Text({
          text: isCurrent
            ? '当前城市'
            : isAvailable
              ? `机票 ¥${option.flightCost.toLocaleString('zh-CN')}`
              : '航班尚未开通',
          style: {
            fontFamily: 'Microsoft YaHei, Arial',
            fontSize: 13,
            fill: isCurrent ? 0x9aa4b2 : isAvailable ? 0xffc97a : 0x64748b,
          }
        });
        costLabel.resolution = textResolution;
        costLabel.roundPixels = true;
        costLabel.anchor.set(1, 0);
        costLabel.x = this.cityItemWidth - 12;
        costLabel.y = Math.round((itemHeight - costLabel.height) / 2);
        itemContainer.addChild(costLabel);

        const updateItemState = (hovered: boolean = false) => {
          if (hovered && !isCurrent && isAvailable) {
            renderBackground(hoverColor);
            return;
          }
          renderBackground(isCurrent ? highlightColor : baseColor);
        };
        this.cityItemUpdateFns.set(option.city, updateItemState);
        updateItemState();

        if (!isCurrent && isAvailable) {
          itemContainer.on('pointerdown', () => {
            this.handleCitySelect(option);
          });
          itemContainer.on('pointerover', () => {
            updateItemState(true);
          });
          itemContainer.on('pointerout', () => {
            updateItemState(false);
          });
        }

        rowContainer.addChild(itemContainer);
      });

      this.cityScrollBox.addItem(rowContainer);
    }
  }

  private handleCitySelect(option: CityTravelOption): void {
    const state = gameStateManager.getState();

    if (gameStateManager.isGameOver()) {
      this.hide();
      this.eventQueue.enqueue([gameEngine.getGameOverEvent(state)]);
      return;
    }

    if (state.city === option.city) {
      return;
    }

    const events = gameStateManager.changeLocation(option.defaultLocation);

    if (events[0]?.data?.travelBlocked) {
      this.hide();
      this.eventQueue.enqueue(events);
      return;
    }

    audioManager.play('flight');
    this.hide();
    this.eventQueue.enqueue(events);
  }

  /**
   * Open travel dialog
   */
  open(): void {
    if (gameStateManager.isGameOver()) {
      const state = gameStateManager.getState();
      this.eventQueue.enqueue([gameEngine.getGameOverEvent(state)]);
      return;
    }

    const state = gameStateManager.getState();
    this.currentCityText.text = getCityLabel(state.city);
    this.timeLeftText.text = `${state.timeLeft}天`;
    this.layoutStatusDisplay();
    this.populateCities();

    this.show();
  }

  protected onOpen(): void {
    this.bindLiveUpdates();
  }

  protected onClose(): void {
    if (this.unsubscribeState) {
      this.unsubscribeState();
      this.unsubscribeState = null;
    }
  }

  private layoutStatusDisplay(): void {
    const labelGap = 8;
    const cityLabelRight = this.cityLabelText.x + this.cityLabelText.width;
    this.currentCityText.x = cityLabelRight + labelGap;

    const timeGap = 8;
    const timeGroupWidth = this.timeLeftLabelText.width + timeGap + this.timeLeftText.width;
    const timeGroupX = this.statusContentWidth - timeGroupWidth;
    this.timeLeftLabelText.x = timeGroupX;
    this.timeLeftText.x = timeGroupX + this.timeLeftLabelText.width + timeGap;
  }

  private bindLiveUpdates(): void {
    if (this.unsubscribeState) {
      return;
    }

    this.unsubscribeState = gameStateManager.subscribe((state) => {
      if (!this.visible) {
        return;
      }

      this.currentCityText.text = getCityLabel(state.city);
      this.timeLeftText.text = `${state.timeLeft}天`;
      this.layoutStatusDisplay();
      this.populateCities();
    });
  }
}
