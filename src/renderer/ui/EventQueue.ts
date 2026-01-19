import type { GameEvent } from '@engine/types';
import { audioManager } from '@audio/AudioManager';
import { NewsDialog } from '../dialogs/NewsDialog';
import { GameOverDialog } from '../dialogs/GameOverDialog';

export class EventQueue {
  private queue: GameEvent[] = [];
  private processing = false;

  constructor(private newsDialog: NewsDialog, private gameOverDialog: GameOverDialog) {}

  isBusy(): boolean {
    return (
      this.processing ||
      this.queue.length > 0 ||
      this.newsDialog.visible ||
      this.gameOverDialog.visible
    );
  }

  enqueue(events: GameEvent[]): void {
    if (events.length === 0) {
      return;
    }

    this.queue.push(...events);
    this.processNext();
  }

  private processNext(): void {
    if (this.processing) {
      return;
    }

    const event = this.queue.shift();
    if (!event) {
      return;
    }

    this.processing = true;

    if (event.sound) {
      const soundId = event.sound.replace('.wav', '') as any;
      audioManager.play(soundId);
    }

    const title = event.type === 'game_over' ? '游戏结束' : '消息';
    if (!this.newsDialog || !this.newsDialog.showMessage) {
      this.processing = false;
      if (event.type === 'game_over') {
        this.queue = [];
        this.openGameOverDialog();
      } else {
        this.processNext();
      }
      return;
    }

    this.newsDialog.showMessage(event.message, title);

    const originalHide = this.newsDialog.hide.bind(this.newsDialog);
    this.newsDialog.hide = () => {
      this.newsDialog.hide = originalHide;
      originalHide();
      this.processing = false;

      if (event.type === 'game_over') {
        this.queue = [];
        this.openGameOverDialog();
        return;
      }

      setTimeout(() => {
        this.processNext();
      }, 300);
    };
  }

  private openGameOverDialog(): void {
    if (!this.gameOverDialog.visible) {
      this.gameOverDialog.open();
    }
  }
}
