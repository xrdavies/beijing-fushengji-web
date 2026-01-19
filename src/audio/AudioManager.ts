/**
 * AudioManager - Audio system using @pixi/sound
 *
 * Features:
 * - Sound loading and playback
 * - Volume control
 * - Enable/disable sound effects
 * - Priority-based loading (critical sounds first)
 */

import { sound } from '@pixi/sound';

export type SoundId =
  // Critical sounds (priority load)
  | 'buy'
  | 'sell'
  | 'door_open'
  | 'door_close'
  | 'death'
  | 'kill'
  | 'airport'
  // Secondary sounds
  | 'breath'
  | 'clunk'
  | 'dog'
  | 'drop'
  | 'eat'
  | 'flee'
  | 'hallu'
  | 'money'
  | 'opendoor'
  | 'shutdoor'
  | 'vomit'
  | 'hos'
  // Health/combat event sounds
  | 'harley'
  | 'hit'
  | 'melee'
  | 'thump'
  | 'ow1'
  | 'ow2'
  | 'ouch'
  | 'shot'
  | 'el'
  | 'level'
  | 'lan';

interface SoundConfig {
  id: SoundId;
  file: string;
  priority: 'critical' | 'secondary';
}

export class AudioManager {
  private static instance: AudioManager;
  private sfxEnabled: boolean = true;
  private loaded: Set<SoundId> = new Set();

  private soundConfigs: SoundConfig[] = [
    // Critical sounds (load first)
    { id: 'buy', file: 'buy.wav', priority: 'critical' },
    { id: 'sell', file: 'money.wav', priority: 'critical' },
    { id: 'door_open', file: 'opendoor.wav', priority: 'critical' },
    { id: 'door_close', file: 'shutdoor.wav', priority: 'critical' },
    { id: 'death', file: 'death.wav', priority: 'critical' },
    { id: 'kill', file: 'kill.wav', priority: 'critical' },
    { id: 'airport', file: 'Airport.wav', priority: 'critical' },

    // Secondary sounds (load later)
    { id: 'breath', file: 'breath.wav', priority: 'secondary' },
    { id: 'clunk', file: 'clunk.wav', priority: 'secondary' },
    { id: 'dog', file: 'dog.wav', priority: 'secondary' },
    { id: 'drop', file: 'drop.wav', priority: 'secondary' },
    { id: 'eat', file: 'eat.wav', priority: 'secondary' },
    { id: 'flee', file: 'flee.wav', priority: 'secondary' },
    { id: 'hallu', file: 'hallu.wav', priority: 'secondary' },
    { id: 'money', file: 'money.wav', priority: 'secondary' },
    { id: 'opendoor', file: 'opendoor.wav', priority: 'secondary' },
    { id: 'shutdoor', file: 'shutdoor.wav', priority: 'secondary' },
    { id: 'vomit', file: 'vomit.wav', priority: 'secondary' },
    { id: 'hos', file: 'hos.wav', priority: 'secondary' },

    // Health/combat event sounds
    { id: 'harley', file: 'harley.wav', priority: 'secondary' },
    { id: 'hit', file: 'hit.wav', priority: 'secondary' },
    { id: 'melee', file: 'melee.wav', priority: 'secondary' },
    { id: 'thump', file: 'thump.wav', priority: 'secondary' },
    { id: 'ow1', file: 'ow1.wav', priority: 'secondary' },
    { id: 'ow2', file: 'ow2.wav', priority: 'secondary' },
    { id: 'ouch', file: 'ouch.wav', priority: 'secondary' },
    { id: 'shot', file: 'shot.wav', priority: 'secondary' },
    { id: 'el', file: 'el.wav', priority: 'secondary' },
    { id: 'level', file: 'level.wav', priority: 'secondary' },
    { id: 'lan', file: 'lan.wav', priority: 'secondary' },
  ];

  private constructor() {
    // Keep audio playing when the browser window loses focus.
    sound.disableAutoPause = true;
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Load critical sounds (priority load)
   */
  async loadCriticalSounds(): Promise<void> {
    const criticalSounds = this.soundConfigs.filter(s => s.priority === 'critical');

    for (const config of criticalSounds) {
      try {
        await sound.add(config.id, `/assets/sound/${config.file}`);
        this.loaded.add(config.id);
        console.log(`Loaded critical sound: ${config.id}`);
      } catch (error) {
        console.error(`Failed to load sound ${config.id}:`, error);
      }
    }
  }

  /**
   * Load secondary sounds (lazy load)
   */
  async loadSecondarySounds(): Promise<void> {
    const secondarySounds = this.soundConfigs.filter(s => s.priority === 'secondary');

    for (const config of secondarySounds) {
      try {
        await sound.add(config.id, `/assets/sound/${config.file}`);
        this.loaded.add(config.id);
        console.log(`Loaded secondary sound: ${config.id}`);
      } catch (error) {
        console.error(`Failed to load sound ${config.id}:`, error);
      }
    }
  }

  /**
   * Play a sound effect
   */
  play(soundId: SoundId, options?: { volume?: number; loop?: boolean }): void {
    if (!this.sfxEnabled) {
      return;
    }

    if (!this.loaded.has(soundId)) {
      console.warn(`Sound ${soundId} not loaded yet`);
      return;
    }

    try {
      sound.play(soundId, {
        volume: options?.volume ?? 1.0,
        loop: options?.loop ?? false,
      });
    } catch (error) {
      console.error(`Failed to play sound ${soundId}:`, error);
    }
  }

  /**
   * Stop a specific sound
   */
  stop(soundId: SoundId): void {
    if (!this.loaded.has(soundId)) {
      return;
    }

    try {
      sound.stop(soundId);
    } catch (error) {
      console.error(`Failed to stop sound ${soundId}:`, error);
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    sound.stopAll();
  }

  /**
   * Enable/disable sound effects
   */
  setSoundEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Get current sound enabled state
   */
  isSoundEnabled(): boolean {
    return this.sfxEnabled;
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setMasterVolume(volume: number): void {
    sound.volumeAll = Math.max(0, Math.min(1, volume));
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();
