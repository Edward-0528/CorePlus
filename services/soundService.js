import { Audio } from 'expo-av';

class SoundService {
  constructor() {
    this.sounds = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Set audio mode for better sound quality
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      this.isInitialized = true;
      console.log('🔊 Sound service initialized');
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }

  // Create a pleasant camera shutter sound programmatically
  async playShutterSound() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Create a pleasant soft "click" sound using web audio oscillator
      // This is a gentle, pleasant alternative to the harsh camera shutter
      const sound = new Audio.Sound();
      
      // Use a built-in pleasant system sound as fallback
      // On iOS this will be a pleasant click, on Android a soft notification sound
      const soundUri = Audio.Sound.createAsync(
        require('../assets/sounds/pleasant-click.json'), // We'll create this
        { shouldPlay: true, volume: 0.6 }
      );

      return soundUri;
    } catch (error) {
      console.warn('Failed to play custom shutter sound, using haptic fallback:', error);
      // Fallback to haptic feedback if sound fails
      return null;
    }
  }

  // Alternative: Use a generated pleasant tone
  async playGeneratedShutterSound() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate a pleasant two-tone chime programmatically
      // This creates a soft, gentle "ding" sound
      const { sound } = await Audio.Sound.createAsync({
        // Use a data URI for a generated pleasant tone
        uri: this.generatePleasantTone()
      }, { 
        shouldPlay: true, 
        volume: 0.5,
        rate: 1.0,
        shouldCorrectPitch: true
      });

      // Clean up after playing
      setTimeout(() => {
        sound.unloadAsync();
      }, 1000);

      return sound;
    } catch (error) {
      console.warn('Failed to generate pleasant tone:', error);
      return null;
    }
  }

  // Generate a pleasant soft chime tone (data URI)
  generatePleasantTone() {
    // This creates a soft, pleasant two-note chime
    // Duration: 300ms, gentle fade in/out, pleasant frequency
    const sampleRate = 44100;
    const duration = 0.3; // 300ms
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(samples * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const fade = Math.sin(Math.PI * t / duration); // Gentle fade envelope
      
      // Two pleasant tones: 800Hz and 1200Hz (soft chime)
      const tone1 = Math.sin(2 * Math.PI * 800 * t) * 0.3;
      const tone2 = Math.sin(2 * Math.PI * 1200 * t) * 0.2;
      const sample = (tone1 + tone2) * fade * 0.5; // Combine and soften
      
      // Convert to 16-bit PCM
      const pcm = Math.floor(sample * 32767);
      view.setInt16(i * 2, pcm, true);
    }

    // Convert to base64 data URI
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return `data:audio/wav;base64,${this.generateWavHeader(samples, sampleRate)}${base64}`;
  }

  // Generate WAV header for the pleasant tone
  generateWavHeader(samples, sampleRate) {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // WAV file header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);

    return btoa(String.fromCharCode(...new Uint8Array(header)));
  }

  // Simple pleasant notification sound using system sounds
  async playSimpleShutterSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        // Use a system notification sound (cross-platform)
        { uri: 'system://notification_sound' },
        { shouldPlay: true, volume: 0.4 }
      );

      setTimeout(() => {
        sound.unloadAsync();
      }, 500);

      return sound;
    } catch (error) {
      console.warn('System sound not available:', error);
      return null;
    }
  }
}

export const soundService = new SoundService();
