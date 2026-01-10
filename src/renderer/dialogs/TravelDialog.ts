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
import { BEIJING_LOCATIONS, SHANGHAI_LOCATIONS, type Location, type GameEvent } from '@engine/types';
import { createButton } from '../ui/SimpleUIHelpers';
import { audioManager } from '@audio/AudioManager';

export class TravelDialog extends BaseDialog {
  private beijingScrollBox!: ScrollBox;
  private shanghaiScrollBox!: ScrollBox;
  private currentCityText!: Text;
  private timeLeftText!: Text;

  constructor() {
    super(600, 500, '旅行');
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

    // Current status
    const statusContainer = new Container();
    statusContainer.x = contentX;
    statusContainer.y = currentY;

    const currentCityLabel = new Text({
      text: '当前城市:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xaaaaaa }
    });
    currentCityLabel.x = 0;
    currentCityLabel.y = 0;
    statusContainer.addChild(currentCityLabel);

    this.currentCityText = new Text({
      text: '北京',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xffaa00, fontWeight: 'bold' }
    });
    this.currentCityText.x = 90;
    this.currentCityText.y = 0;
    statusContainer.addChild(this.currentCityText);

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

    this.addChild(statusContainer);

    currentY += 40;

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
      width: 250,
      height: 250,
      background: 0x1a1a1a,
      radius: 5,
    });
    this.beijingScrollBox.x = contentX;
    this.beijingScrollBox.y = currentY;
    this.addChild(this.beijingScrollBox);

    // Populate Beijing locations
    this.populateLocations(this.beijingScrollBox, BEIJING_LOCATIONS);

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
      width: 250,
      height: 250,
      background: 0x1a1a1a,
      radius: 5,
    });
    this.shanghaiScrollBox.x = contentX + 280;
    this.shanghaiScrollBox.y = currentY;
    this.addChild(this.shanghaiScrollBox);

    // Populate Shanghai locations
    this.populateLocations(this.shanghaiScrollBox, SHANGHAI_LOCATIONS);

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
  private populateLocations(scrollBox: ScrollBox, locations: Location[]): void {
    let yOffset = 10;

    for (const location of locations) {
      const itemContainer = new Container();
      itemContainer.interactive = true;
      itemContainer.cursor = 'pointer';

      // Background
      const background = new Graphics();
      background.roundRect(5, 0, 230, 35, 5);
      background.fill(0x2a2a2a);
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
      nameText.x = 15;
      nameText.y = 10;
      itemContainer.addChild(nameText);

      // Click handler
      itemContainer.on('pointerdown', () => {
        this.handleLocationSelect(location);
      });

      // Hover effect
      itemContainer.on('pointerover', () => {
        background.clear();
        background.roundRect(5, 0, 230, 35, 5);
        background.fill(0x3a7bc8);
      });

      itemContainer.on('pointerout', () => {
        background.clear();
        background.roundRect(5, 0, 230, 35, 5);
        background.fill(0x2a2a2a);
      });

      itemContainer.y = yOffset;
      scrollBox.addItem(itemContainer);

      yOffset += 40;
    }
  }

  /**
   * Handle location selection
   */
  private handleLocationSelect(location: Location): void {
    const state = gameStateManager.getState();

    // CRITICAL: Prevent travel if game is over
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot travel');
      this.hide();
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

    // Show events if any
    if (events.length > 0) {
      // Check for game over event
      const gameOverEvent = events.find((e) => e.type === 'game_over');
      if (gameOverEvent) {
        // Show liquidation message first
        const newsDialog = this.parent?.children.find(
          (child) => child.constructor.name === 'NewsDialog'
        ) as any;

        if (newsDialog && newsDialog.showMessage) {
          newsDialog.showMessage(gameOverEvent.message, '游戏结束');
        }

        // Open game over dialog
        const gameOverDialog = this.parent?.children.find(
          (child) => child.constructor.name === 'GameOverDialog'
        ) as any;

        if (gameOverDialog && gameOverDialog.open) {
          // Delay to allow user to read liquidation message
          setTimeout(() => {
            gameOverDialog.open();
          }, 1000);
        }
        return;
      }

      // Show events one by one (matching original C++ game behavior)
      // Original: Each CRijiDlg.DoModal() shows ONE event, then next event
      const newsDialog = this.parent?.children.find(
        (child) => child.constructor.name === 'NewsDialog'
      ) as any;

      if (newsDialog && newsDialog.showMessage) {
        // Show events sequentially, one dialog at a time
        this.showEventsSequentially(events, newsDialog, 0);
      }
    }

    // Check for death
    if (state.health <= 0) {
      audioManager.play('death');
      // Trigger game over
      const gameOverDialog = this.parent?.children.find(
        (child) => child.constructor.name === 'GameOverDialog'
      ) as any;

      if (gameOverDialog && gameOverDialog.open) {
        gameOverDialog.open();
      }
    }
  }

  /**
   * Open travel dialog
   */
  open(): void {
    // CRITICAL: Prevent opening if game is over
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot open travel');

      // Show game over dialog
      const gameOverDialog = this.parent?.children.find(
        (child) => child.constructor.name === 'GameOverDialog'
      ) as any;

      if (gameOverDialog && gameOverDialog.open) {
        gameOverDialog.open();
      }
      return;
    }

    const state = gameStateManager.getState();

    // Update UI
    this.currentCityText.text = state.city === 'beijing' ? '北京' : '上海';
    this.timeLeftText.text = `${state.timeLeft}天`;

    this.show();
  }

  /**
   * Show events sequentially, one at a time
   * Matches original C++ game behavior where each event triggers a separate modal dialog
   */
  private showEventsSequentially(events: GameEvent[], newsDialog: any, index: number): void {
    if (index >= events.length) {
      // All events shown
      return;
    }

    const event = events[index];

    // Play event sound if available
    if (event.sound) {
      const soundId = event.sound.replace('.wav', '') as any;
      audioManager.play(soundId);
    }

    // Show this event's message
    newsDialog.showMessage(event.message, '消息');

    // Wait for dialog to close, then show next event
    // We'll override the dialog's hide method temporarily
    const originalHide = newsDialog.hide.bind(newsDialog);
    newsDialog.hide = () => {
      // Restore original hide method
      newsDialog.hide = originalHide;

      // Call original hide
      originalHide();

      // Show next event after a short delay (to allow dialog close animation)
      setTimeout(() => {
        this.showEventsSequentially(events, newsDialog, index + 1);
      }, 300);
    };
  }

  protected onOpen(): void {
    // Dialog opened
  }

  protected onClose(): void {
    // Dialog closed
  }
}
