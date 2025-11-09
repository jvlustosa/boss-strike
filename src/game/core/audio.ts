// Audio system for game sound effects
class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled = true;

  loadSound(name: string, path: string, critical = false): void {
    const audio = new Audio(path);
    audio.preload = critical ? 'auto' : 'metadata';
    if (critical) {
      // Force immediate loading for critical sounds
      audio.load();
    }
    this.sounds.set(name, audio);
  }

  playSound(name: string, volume = 1, pitchVariation = 0): void {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound "${name}" not found`);
      return;
    }

    // Clone audio to allow overlapping plays
    const audioClone = sound.cloneNode() as HTMLAudioElement;
    audioClone.volume = Math.max(0, Math.min(1, volume));
    
    // Apply random pitch variation
    if (pitchVariation > 0) {
      const randomPitch = 1 + (Math.random() - 0.5) * pitchVariation;
      audioClone.playbackRate = Math.max(0.5, Math.min(2, randomPitch));
    }
    
    audioClone.play().catch((error) => {
      console.warn(`Failed to play sound "${name}":`, error);
    });
  }

  // Fast play for critical sounds with minimal delay
  playCriticalSound(name: string, volume = 1): void {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Critical sound "${name}" not found`);
      return;
    }

    // Use original audio for critical sounds to avoid clone delay
    sound.currentTime = 0;
    sound.volume = Math.max(0, Math.min(1, volume));
    
    sound.play().catch((error) => {
      console.warn(`Failed to play critical sound "${name}":`, error);
    });
  }

  // Convenience method for random pitch sounds
  playRandomPitch(name: string, volume = 1, minPitch = 0.8, maxPitch = 1.2): void {
    const randomPitch = minPitch + Math.random() * (maxPitch - minPitch);
    const sound = this.sounds.get(name);
    if (!sound || !this.enabled) return;

    const audioClone = sound.cloneNode() as HTMLAudioElement;
    audioClone.volume = Math.max(0, Math.min(1, volume));
    audioClone.playbackRate = randomPitch;
    
    audioClone.play().catch((error) => {
      console.warn(`Failed to play sound "${name}":`, error);
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const audioManager = new AudioManager();

// Load game sounds
audioManager.loadSound('shoot', '/audio/mixkit-explainer-video-game-alert-sweep-236.wav');
audioManager.loadSound('boss_shoot', '/audio/mixkit-explainer-video-game-alert-sweep-236.wav');
audioManager.loadSound('hit', '/audio/mixkit-fast-blow-2144.wav');
audioManager.loadSound('boss_hit', '/audio/mixkit-weak-fast-blow-2145.wav');
audioManager.loadSound('heal', '/audio/heal-health.mp3', true); // Critical sound
audioManager.loadSound('shield', '/audio/Divinity_Shield.mp3', true); // Critical sound
audioManager.loadSound('critical_hit', '/audio/critical-hit-sfx.mp3', true); // Critical hit sound
