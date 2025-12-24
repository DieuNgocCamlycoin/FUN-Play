import { useCallback, useRef, useEffect } from 'react';

interface SoundConfig {
  src: string;
  volume?: number;
}

type SoundType = 'coinDrop' | 'angelFly' | 'celebrate' | 'ding' | 'whoosh' | 'pop';

// Base64 encoded simple sounds (tiny, no external dependencies)
const SOUND_EFFECTS: Record<SoundType, SoundConfig> = {
  // Coin drop sound - short metallic clink
  coinDrop: {
    src: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQgAAAD/AACAgICAgICA',
    volume: 0.4,
  },
  // Angel flying whoosh
  angelFly: {
    src: 'data:audio/wav;base64,UklGRiQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/+AgICAgICAgP8AAICA',
    volume: 0.3,
  },
  // Celebration fanfare
  celebrate: {
    src: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAD/gICAYICAgP+AgICAgICA/4CAgICAgID/gICAgICAgP8A',
    volume: 0.5,
  },
  // Simple ding
  ding: {
    src: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAD/gP8AgP+AgP+AgP+AgP+A/4D/gP+A/4D/gP+A/wAAgA',
    volume: 0.4,
  },
  // Whoosh sound
  whoosh: {
    src: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAYIBggGCAYIBggGCAYIBggGCAYIBggGCAYIBggA==',
    volume: 0.3,
  },
  // Pop sound
  pop: {
    src: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8AAA==',
    volume: 0.4,
  },
};

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundCacheRef = useRef<Map<SoundType, AudioBuffer>>(new Map());
  const isEnabledRef = useRef(true);

  // Initialize AudioContext on first interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.debug('AudioContext not available');
      }
    }
    return audioContextRef.current;
  }, []);

  // Generate a fun coin sound using Web Audio API
  const generateCoinSound = useCallback((ctx: AudioContext) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }, []);

  // Generate whoosh sound
  const generateWhooshSound = useCallback((ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.sin(Math.PI * t / 0.3);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.3);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(ctx.destination);
    source.start();
  }, []);

  // Generate celebration sound (multiple tones)
  const generateCelebrateSound = useCallback((ctx: AudioContext) => {
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.08 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.3);

      oscillator.start(ctx.currentTime + i * 0.08);
      oscillator.stop(ctx.currentTime + i * 0.08 + 0.3);
    });
  }, []);

  // Generate ding sound
  const generateDingSound = useCallback((ctx: AudioContext) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, []);

  // Generate pop sound
  const generatePopSound = useCallback((ctx: AudioContext) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, []);

  // Play a sound by type
  const playSound = useCallback((type: SoundType) => {
    if (!isEnabledRef.current) return;

    const ctx = initAudioContext();
    if (!ctx) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    switch (type) {
      case 'coinDrop':
        generateCoinSound(ctx);
        break;
      case 'angelFly':
      case 'whoosh':
        generateWhooshSound(ctx);
        break;
      case 'celebrate':
        generateCelebrateSound(ctx);
        break;
      case 'ding':
        generateDingSound(ctx);
        break;
      case 'pop':
        generatePopSound(ctx);
        break;
      default:
        generateDingSound(ctx);
    }
  }, [initAudioContext, generateCoinSound, generateWhooshSound, generateCelebrateSound, generateDingSound, generatePopSound]);

  // Play multiple coin sounds in sequence
  const playCoinShower = useCallback((count: number = 5) => {
    if (!isEnabledRef.current) return;

    const ctx = initAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Play celebration first
    generateCelebrateSound(ctx);

    // Then play coin sounds with delays
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        generateCoinSound(ctx);
      }, 200 + i * 80);
    }
  }, [initAudioContext, generateCoinSound, generateCelebrateSound]);

  // Toggle sound effects
  const setEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playSound,
    playCoinShower,
    setEnabled,
    coinDrop: () => playSound('coinDrop'),
    angelFly: () => playSound('angelFly'),
    celebrate: () => playSound('celebrate'),
    ding: () => playSound('ding'),
    whoosh: () => playSound('whoosh'),
    pop: () => playSound('pop'),
  };
};

export default useSoundEffects;
