import { useState, useCallback, useRef, useEffect } from 'react';
import type { TimerState, SessionType, PomodoroSession, Settings } from '../types';

function playNotificationSound(volume: number) {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const startTime = now + i * 0.15;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });

    // Add a soft harmonic layer
    const harmonicOsc = ctx.createOscillator();
    const harmonicGain = ctx.createGain();
    harmonicOsc.type = 'triangle';
    harmonicOsc.frequency.setValueAtTime(880, now);
    harmonicGain.gain.setValueAtTime(0, now);
    harmonicGain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.05);
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(ctx.destination);
    harmonicOsc.start(now);
    harmonicOsc.stop(now + 1.5);

    setTimeout(() => ctx.close(), 3000);
  } catch {
    // Web Audio API not available
  }
}

function showNotification(sessionType: SessionType) {
  const messages: Record<SessionType, { title: string; body: string }> = {
    work: { title: '🍅 Focus Complete!', body: 'Great work! Time for a break.' },
    shortBreak: { title: '☕ Break Over!', body: 'Ready to focus again?' },
    longBreak: { title: '🌿 Long Break Over!', body: 'Feeling refreshed? Let\'s go!' },
  };

  if ('Notification' in window && Notification.permission === 'granted') {
    const msg = messages[sessionType];
    new Notification(msg.title, { body: msg.body, icon: '🍅' });
  }
}

interface UseTimerReturn {
  timeRemaining: number;
  timerState: TimerState;
  sessionType: SessionType;
  currentStreak: number;
  totalDuration: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
}

export default function useTimer(
  settings: Settings,
  onSessionComplete: (session: PomodoroSession) => void
): UseTimerReturn {
  const getDuration = useCallback(
    (type: SessionType): number => {
      switch (type) {
        case 'work':
          return settings.workDuration * 60;
        case 'shortBreak':
          return settings.shortBreakDuration * 60;
        case 'longBreak':
          return settings.longBreakDuration * 60;
      }
    },
    [settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]
  );

  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timeRemaining, setTimeRemaining] = useState(() => getDuration('work'));
  const [currentStreak, setCurrentStreak] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number>(0);
  const completedWorkCountRef = useRef(0);

  const totalDuration = getDuration(sessionType);

  // Update time remaining when settings change and timer is idle
  useEffect(() => {
    if (timerState === 'idle') {
      setTimeRemaining(getDuration(sessionType));
    }
  }, [getDuration, sessionType, timerState]);

  const getNextSession = useCallback((): SessionType => {
    if (sessionType !== 'work') {
      return 'work';
    }
    const nextCount = completedWorkCountRef.current + 1;
    if (nextCount % settings.longBreakInterval === 0) {
      return 'longBreak';
    }
    return 'shortBreak';
  }, [sessionType, settings.longBreakInterval]);

  const completeSession = useCallback(() => {
    const session: PomodoroSession = {
      id: crypto.randomUUID(),
      type: sessionType,
      startedAt: sessionStartRef.current,
      completedAt: Date.now(),
      duration: getDuration(sessionType),
    };

    onSessionComplete(session);

    if (sessionType === 'work') {
      completedWorkCountRef.current += 1;
      setCurrentStreak((s) => s + 1);
    }

    if (settings.soundEnabled) {
      playNotificationSound(settings.volume);
    }
    showNotification(sessionType);

    const next = getNextSession();
    setSessionType(next);
    setTimeRemaining(getDuration(next));
    setTimerState('idle');
  }, [sessionType, getDuration, onSessionComplete, settings.soundEnabled, settings.volume, getNextSession]);

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // Schedule completeSession on next tick to avoid state update conflicts
            setTimeout(() => completeSession(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState, completeSession]);

  const start = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    sessionStartRef.current = Date.now();
    setTimerState('running');
  }, []);

  const pause = useCallback(() => {
    setTimerState('paused');
  }, []);

  const resume = useCallback(() => {
    setTimerState('running');
  }, []);

  const reset = useCallback(() => {
    setTimerState('idle');
    setTimeRemaining(getDuration(sessionType));
  }, [getDuration, sessionType]);

  const skip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const next = getNextSession();
    if (sessionType === 'work') {
      // Don't increment streak on skip
    }
    setSessionType(next);
    setTimeRemaining(getDuration(next));
    setTimerState('idle');
  }, [getNextSession, getDuration, sessionType]);

  return {
    timeRemaining,
    timerState,
    sessionType,
    currentStreak,
    totalDuration,
    start,
    pause,
    resume,
    reset,
    skip,
  };
}
