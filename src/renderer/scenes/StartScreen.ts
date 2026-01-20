/**
 * Start Screen - Entry page for name input, story, and leaderboard
 */

import { Container, Graphics, Text } from 'pixi.js';
import { createButton } from '../ui/SimpleUIHelpers';
import { gameStateManager } from '@state/GameStateManager';
import { IMEInput } from '../ui/IMEInput';

export class StartScreen extends Container {
  private nameInput!: IMEInput;
  private onShowLeaderboard?: () => void;

  constructor() {
    super();
    this.visible = false;
    this.eventMode = 'static';

    this.createLayout();
  }

  setLeaderboardHandler(handler: () => void): void {
    this.onShowLeaderboard = handler;
  }

  setName(name: string): void {
    if (this.nameInput) {
      this.nameInput.value = name;
    }
  }

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  updateLayout(): void {
  }

  private createLayout(): void {
    const background = new Graphics();
    background.rect(0, 0, 800, 600);
    background.fill({ color: 0x0b0f14, alpha: 0.95 });
    background.eventMode = 'static';
    background.on('pointerdown', (event) => {
      event.stopPropagation();
    });
    this.addChild(background);

    const panel = new Graphics();
    panel.roundRect(140, 60, 520, 480, 16);
    panel.fill(0x1b232c);
    panel.stroke({ width: 1, color: 0x2b3440 });
    this.addChild(panel);

    const title = new Text({
      text: '北京浮生记(重制版)',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 28,
        fill: 0xf8fafc,
        fontWeight: 'bold',
        letterSpacing: 2,
      }
    });
    title.anchor.set(0.5, 0);
    title.x = 400;
    title.y = 90;
    this.addChild(title);

    const subtitle = new Text({
      text: '四十天，逆风翻盘',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 14,
        fill: 0x93c5fd,
      }
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = 400;
    subtitle.y = 130;
    this.addChild(subtitle);

    const storyText = new Text({
      text:
        '您从家乡来到北京，举目无亲，仅剩现金2000元，同时还欠村长5000元高利贷。' +
        '自己动手，丰衣足食！考虑再三您决定在北京做生意，每天在地铁各站之间倒卖各种物品。' +
        '您只能在北京停留40天，然后回家乡结婚。您的目标是在这40天内还掉迅速增长的债务，' +
        '而且还要赚大钱，登上富人榜。但是发财并不容易，北京的小偷、流氓、坏人、工商局、' +
        '卫生局的人都会找您麻烦。您必须与他们斗智斗勇。',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 13,
        fill: 0xcbd5f5,
        align: 'left',
        lineHeight: 16,
        whiteSpace: 'normal',
        breakWords: true,
        wordWrap: true,
        wordWrapWidth: 300,
      }
    });
    storyText.anchor.set(0.5, 0);
    storyText.x = 400;
    storyText.y = 160;
    this.addChild(storyText);

    const nameLabel = new Text({
      text: '你的名字',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 14,
        fill: 0xe2e8f0,
      }
    });
    nameLabel.x = 240;
    nameLabel.y = 330;
    this.addChild(nameLabel);

    const inputWidth = 320;
    const inputHeight = 36;
    const inputX = 240;
    const inputY = 360;
    const inputBg = new Graphics();
    inputBg.roundRect(0, 0, inputWidth, inputHeight, 8);
    inputBg.fill(0x0f141a);
    inputBg.stroke({ width: 1, color: 0x334155 });

    this.nameInput = new IMEInput({
      bg: inputBg,
      placeholder: '请输入你的大名',
      value: '',
      maxLength: 8,
      align: 'left',
      padding: { left: 10, right: 10, top: 8, bottom: 8 },
      addMask: true,
      textStyle: {
        fontFamily: 'Microsoft YaHei, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
        fontSize: 16,
        fill: 0xe2e8f0,
      },
    });
    this.nameInput.x = inputX;
    this.nameInput.y = inputY;
    this.nameInput.width = inputWidth;
    this.nameInput.height = inputHeight;
    this.addChild(this.nameInput);

    const hintText = new Text({
      text: '最多8个字',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 12,
        fill: 0x64748b,
      }
    });
    hintText.x = 240;
    hintText.y = 402;
    this.addChild(hintText);

    const startButton = createButton('开始游戏', 140, 40, 0x2f6fce, () => this.handleStart());
    startButton.x = 240;
    startButton.y = 440;
    this.addChild(startButton);

    const leaderboardButton = createButton('富人榜', 140, 40, 0x3a7bc8, () => {
      if (this.onShowLeaderboard) {
        this.onShowLeaderboard();
      }
    });
    leaderboardButton.x = 420;
    leaderboardButton.y = 440;
    this.addChild(leaderboardButton);
  }

  private handleStart(): void {
    const name = this.nameInput?.value?.trim() ?? '';
    const trimmed = Array.from(name).slice(0, 8).join('');
    const finalName = trimmed.length > 0 ? trimmed : '无名小卒';
    gameStateManager.setPlayerName(finalName);
    this.hide();
  }
}
