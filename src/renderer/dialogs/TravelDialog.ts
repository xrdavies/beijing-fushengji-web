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
import { BEIJING_LOCATIONS, GAME_CONSTANTS, SHANGHAI_LOCATIONS, type City, type Location } from '@engine/types';
import { createButton } from '../ui/SimpleUIHelpers';
import { EventQueue } from '../ui/EventQueue';
import { audioManager } from '@audio/AudioManager';

export class TravelDialog extends BaseDialog {
  private locationScrollBox!: ScrollBox;
  private activeCity: City = 'beijing';
  private lastKnownCity: City | null = null;
  private locationItemWidth: number = 0;
  private locationLabelText!: Text;
  private currentCityText!: Text;
  private locationSeparatorText!: Text;
  private currentLocationText!: Text;
  private statusContentWidth: number = 0;
  private timeLeftLabelText!: Text;
  private timeLeftText!: Text;
  private locationItemUpdateFns: Map<number, (hovered?: boolean) => void> = new Map();
  private tabButtons: Array<{ city: City; background: Graphics; label: Text }> = [];
  private tabWidth: number = 120;
  private tabHeight: number = 30;
  private unsubscribeState: (() => void) | null = null;
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
    let currentY = panelY + 75;

    const contentWidth = this.dialogWidth - 60;
    const listWidth = contentWidth;
    const listHeight = 250;
    const listPadding = 14;
    const columnGap = 16;
    const itemWidth = Math.floor((listWidth - listPadding * 2 - columnGap) / 2);
    this.locationItemWidth = itemWidth;
    this.statusContentWidth = contentWidth;

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

    currentY += 64;

    // Tabs
    const tabHeight = this.tabHeight;
    const tabWidth = this.tabWidth;
    const tabGap = 12;
    const tabContainer = new Container();
    tabContainer.x = contentX;
    tabContainer.y = currentY;

    const createTab = (city: City, label: string, index: number) => {
      const tab = new Container();
      tab.eventMode = 'static';
      tab.cursor = 'pointer';
      tab.x = index * (tabWidth + tabGap);

      const background = new Graphics();
      background.roundRect(0, 0, tabWidth, tabHeight, 6);
      tab.addChild(background);

      const text = new Text({
        text: label,
        style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' }
      });
      text.anchor.set(0.5);
      text.x = tabWidth / 2;
      text.y = tabHeight / 2;
      tab.addChild(text);

      tab.on('pointerdown', () => this.switchCityTab(city));

      this.tabButtons.push({ city, background, label: text });
      tabContainer.addChild(tab);
    };

    createTab('beijing', '北京（本地旅行）', 0);
    createTab('shanghai', '上海（需要机票）', 1);
    this.addChild(tabContainer);

    currentY += tabHeight + 12;

    // Location list ScrollBox
    this.locationScrollBox = new ScrollBox({
      width: listWidth,
      height: listHeight,
      background: 0x1a1a1a,
      radius: 5,
      type: 'vertical',
      padding: listPadding,
      elementsMargin: 12,
    });
    this.locationScrollBox.x = contentX;
    this.locationScrollBox.y = currentY;
    this.addChild(this.locationScrollBox);

    this.switchCityTab(this.activeCity);

    currentY += listHeight + 14;

    // Close button
    const closeButton = createButton('关闭', 120, 40, 0x666666, () => this.hide());
    closeButton.x = panelX + (this.dialogWidth - 120) / 2;
    closeButton.y = currentY;
    this.addChild(closeButton);
  }

  /**
   * Populate locations in a scrollbox
   */
  private populateLocations(scrollBox: ScrollBox, locations: Location[], itemWidth: number): void {
    scrollBox.removeItems();
    this.locationItemUpdateFns.clear();

    const textResolution = this.currentCityText?.resolution || window.devicePixelRatio || 1;
    const currentCity = gameStateManager.getState().city;
    const subwayCost = currentCity === 'beijing'
      ? GAME_CONSTANTS.SUBWAY_TRAVEL_COST_BEIJING
      : GAME_CONSTANTS.SUBWAY_TRAVEL_COST_SHANGHAI;
    const itemHeight = 34;
    const columnGap = 16;
    const baseColor = 0x2a2a2a;
    const hoverColor = 0x3a7bc8;
    const highlightColor = 0x3a4a66;

    for (let i = 0; i < locations.length; i += 2) {
      const rowContainer = new Container();

      const rowLocations = locations.slice(i, i + 2);

      rowLocations.forEach((location, columnIndex) => {
      const itemContainer = new Container();
      itemContainer.interactive = true;
      itemContainer.cursor = 'pointer';
      itemContainer.x = columnIndex * (itemWidth + columnGap);

      // Background
      const background = new Graphics();
      const renderBackground = (color: number) => {
        background.clear();
        background.roundRect(0, 0, itemWidth, itemHeight, 6);
        background.fill(color);
      };
      renderBackground(baseColor);
      itemContainer.addChild(background);

      // Location name
      const nameText = new Text({
        text: location.name,
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

      const isLocal = location.city === currentCity;
      const costValue = isLocal ? subwayCost : GAME_CONSTANTS.FLIGHT_TRAVEL_COST;
      const costText = isLocal ? `地铁 ¥${costValue}` : `机票 ¥${costValue}`;
      const costLabel = new Text({
        text: costText,
        style: {
          fontFamily: 'Microsoft YaHei, Arial',
          fontSize: 13,
          fill: isLocal ? 0x9aa4b2 : 0xffc97a,
        }
      });
      costLabel.resolution = textResolution;
      costLabel.roundPixels = true;
      costLabel.anchor.set(1, 0);
      costLabel.x = itemWidth - 12;
      costLabel.y = Math.round((itemHeight - costLabel.height) / 2);
      itemContainer.addChild(costLabel);

      const updateItemState = (hovered: boolean = false) => {
        const currentId = gameStateManager.getState().currentLocation?.id;
        const isCurrent = currentId === location.id;
        if (hovered) {
          renderBackground(hoverColor);
          return;
        }
        renderBackground(isCurrent ? highlightColor : baseColor);
      };
      this.locationItemUpdateFns.set(location.id, updateItemState);
      updateItemState();

      // Click handler
      itemContainer.on('pointerdown', () => {
        this.handleLocationSelect(location);
      });

      // Hover effect
      itemContainer.on('pointerover', () => {
        updateItemState(true);
      });

      itemContainer.on('pointerout', () => {
        updateItemState(false);
      });

      rowContainer.addChild(itemContainer);
      });

      scrollBox.addItem(rowContainer);
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

    // Check if traveling across cities (requires airplane sound)
    if (location.city !== state.city) {
      audioManager.play('airport');
    }

    // Trigger location change (this will generate events)
    const events = gameStateManager.changeLocation(location);

    if (events[0]?.data?.travelBlocked) {
      this.eventQueue.enqueue(events);
      return;
    }

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
    this.timeLeftText.text = `${state.timeLeft}天`;
    this.layoutStatusDisplay();
    this.updateTabLabels(state.city);
    this.switchCityTab(state.city);
    this.lastKnownCity = state.city;

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

  private layoutLocationDisplay(): void {
    const labelGap = 8;
    const separatorGap = 6;
    const labelRight = this.locationLabelText.x + this.locationLabelText.width;

    this.currentCityText.x = labelRight + labelGap;
    this.locationSeparatorText.x = this.currentCityText.x + this.currentCityText.width + separatorGap;
    this.currentLocationText.x =
      this.locationSeparatorText.x + this.locationSeparatorText.width + separatorGap;
  }

  private layoutStatusDisplay(): void {
    this.layoutLocationDisplay();

    const timeGap = 8;
    const timeGroupWidth = this.timeLeftLabelText.width + timeGap + this.timeLeftText.width;
    const timeGroupX = this.statusContentWidth - timeGroupWidth;
    this.timeLeftLabelText.x = timeGroupX;
    this.timeLeftText.x = timeGroupX + this.timeLeftLabelText.width + timeGap;
  }

  private refreshLocationHighlights(): void {
    this.locationItemUpdateFns.forEach((updateItem) => updateItem(false));
  }

  private bindLiveUpdates(): void {
    if (this.unsubscribeState) {
      return;
    }

    this.unsubscribeState = gameStateManager.subscribe((state) => {
      if (!this.visible) {
        return;
      }

      this.currentCityText.text = state.city === 'beijing' ? '北京' : '上海';
      this.currentLocationText.text = state.currentLocation?.name ?? '未知';
      this.timeLeftText.text = `${state.timeLeft}天`;
      this.layoutStatusDisplay();
      this.updateTabLabels(state.city);
      if (this.lastKnownCity !== state.city) {
        this.lastKnownCity = state.city;
        const locations =
          this.activeCity === 'beijing' ? BEIJING_LOCATIONS : SHANGHAI_LOCATIONS;
        this.populateLocations(this.locationScrollBox, locations, this.locationItemWidth);
      }
      this.refreshLocationHighlights();
    });
  }

  private updateTabLabels(currentCity: City): void {
    this.tabButtons.forEach((tab) => {
      const isLocal = tab.city === currentCity;
      const cityLabel = tab.city === 'beijing' ? '北京' : '上海';
      tab.label.text = `${cityLabel}（${isLocal ? '本地旅行' : '需要机票'}）`;
    });
  }

  private switchCityTab(city: City): void {
    if (this.activeCity === city && this.locationItemUpdateFns.size > 0) {
      this.refreshLocationHighlights();
      return;
    }

    this.activeCity = city;
    const locations = city === 'beijing' ? BEIJING_LOCATIONS : SHANGHAI_LOCATIONS;
    this.populateLocations(this.locationScrollBox, locations, this.locationItemWidth);
    this.refreshLocationHighlights();

    this.tabButtons.forEach((tab) => {
      const isActive = tab.city === city;
      tab.background.clear();
      tab.background.roundRect(0, 0, this.tabWidth, this.tabHeight, 6);
      tab.background.fill(isActive ? 0x3a7bc8 : 0x2a2a2a);
      tab.label.style.fill = isActive ? 0xffffff : 0xaaaaaa;
    });
  }
}
