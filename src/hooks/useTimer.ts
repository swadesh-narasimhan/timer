import { useState, useCallback, useRef, useEffect } from 'react';
import type { TimerState, SessionType, PomodoroSession, Settings } from '../types';

export const TIMER_STORAGE_KEY = 'pomodoro-active-timer-session';

export interface PersistedTimerSession {
  version: 1;
  sessionId: string;
  timerState: TimerState;
  sessionType: SessionType;
  targetEndTime: number | null; // Absolute deadline in ms (epoch)
  remainingSeconds: number; // Seconds remaining when paused or idle
  startedAt: number;
  completedWorkCount: number;
}

function safeGetStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Storage restricted or unavailable
  }
  return null;
}

export function loadPersistedSession(): PersistedTimerSession | null {
  const storage = safeGetStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTimerSession;
    if (parsed && parsed.version === 1 && typeof parsed.sessionId === 'string') {
      return parsed;
    }
  } catch {
    // Ignore corrupt storage
  }
  return null;
}

export function savePersistedSession(session: PersistedTimerSession | null): void {
  const storage = safeGetStorage();
  if (!storage) return;
  try {
    if (!session) {
      storage.removeItem(TIMER_STORAGE_KEY);
    } else {
      storage.setItem(TIMER_STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage quota or access issues
  }
}

function playNotificationSound(volume: number) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
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

    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // Closed
      }
    }, 3000);
  } catch {
    // Web Audio API not available or suspended
  }
}

function showNotification(sessionType: SessionType) {
  const messages: Record<SessionType, { title: string; body: string }> = {
    work: { title: '🍅 Focus Complete!', body: 'Great work! Time for a break.' },
    shortBreak: { title: '☕ Break Over!', body: 'Ready to focus again?' },
    longBreak: { title: '🌿 Long Break Over!', body: "Feeling refreshed? Let's go!" },
  };

  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const msg = messages[sessionType];
      new Notification(msg.title, { body: msg.body, icon: '🍅' });
    }
  } catch {
    // Notification API failure fallback
  }
}

export interface UseTimerReturn {
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

  // Initialize state from persisted storage if available
  const initialDataRef = useRef<PersistedTimerSession | null>(null);
  if (initialDataRef.current === null) {
    initialDataRef.current = loadPersistedSession();
  }

  const initial = initialDataRef.current;

  // Determine initial values
  const initialSessionType: SessionType = initial?.sessionType || 'work';
  const initialDuration = getDuration(initialSessionType);

  let initialTimerState: TimerState = 'idle';
  let initialTimeRemaining = initialDuration;

  if (initial) {
    if (initial.timerState === 'paused') {
      initialTimerState = 'paused';
      initialTimeRemaining = Math.max(0, initial.remainingSeconds);
    } else if (initial.timerState === 'running' && initial.targetEndTime) {
      const now = Date.now();
      if (now < initial.targetEndTime) {
        initialTimerState = 'running';
        initialTimeRemaining = Math.max(0, Math.ceil((initial.targetEndTime - now) / 1000));
      } else {
        // Expired during downtime - will be handled in mount effect
        initialTimerState = 'running';
        initialTimeRemaining = 0;
      }
    } else {
      initialTimeRemaining = initial.remainingSeconds || initialDuration;
    }
  }

  const [sessionType, setSessionType] = useState<SessionType>(initialSessionType);
  const [timerState, setTimerState] = useState<TimerState>(initialTimerState);
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTimeRemaining);
  const [currentStreak, setCurrentStreak] = useState<number>(initial?.completedWorkCount || 0);

  // Authoritative timing refs
  const targetEndTimeRef = useRef<number | null>(initial?.targetEndTime || null);
  const sessionStartRef = useRef<number>(initial?.startedAt || 0);
  const sessionIdRef = useRef<string>(initial?.sessionId || crypto.randomUUID());
  const completedWorkCountRef = useRef<number>(initial?.completedWorkCount || 0);
  const completingSessionIdRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Keep callback and settings in fresh refs to avoid stale closures during event listeners
  const onSessionCompleteRef = useRef(onSessionComplete);
  onSessionCompleteRef.current = onSessionComplete;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const getDurationRef = useRef(getDuration);
  getDurationRef.current = getDuration;

  const sessionTypeRef = useRef(sessionType);
  sessionTypeRef.current = sessionType;

  const timerStateRef = useRef(timerState);
  timerStateRef.current = timerState;

  const timeRemainingRef = useRef(timeRemaining);
  timeRemainingRef.current = timeRemaining;

  const totalDuration = getDuration(sessionType);

  const getNextSession = useCallback((currentType: SessionType, workCount: number): SessionType => {
    if (currentType !== 'work') {
      return 'work';
    }
    const nextCount = workCount + 1;
    if (nextCount % settingsRef.current.longBreakInterval === 0) {
      return 'longBreak';
    }
    return 'shortBreak';
  }, []);

  // Complete session: idempotent, single-flight per sessionId
  const completeSession = useCallback(
    (forcedCompletedAt?: number) => {
      const currentSessionId = sessionIdRef.current;
      const currentType = sessionTypeRef.current;

      // Prevent duplicate completion
      if (completingSessionIdRef.current === currentSessionId) {
        return;
      }
      completingSessionIdRef.current = currentSessionId;

      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const completedAt = forcedCompletedAt || targetEndTimeRef.current || Date.now();
      const startedAt = sessionStartRef.current || completedAt - getDurationRef.current(currentType) * 1000;

      const session: PomodoroSession = {
        id: currentSessionId,
        type: currentType,
        startedAt,
        completedAt,
        duration: getDurationRef.current(currentType),
      };

      // Notify consumer
      onSessionCompleteRef.current(session);

      let newWorkCount = completedWorkCountRef.current;
      if (currentType === 'work') {
        newWorkCount += 1;
        completedWorkCountRef.current = newWorkCount;
        setCurrentStreak((s) => s + 1);
      }

      if (settingsRef.current.soundEnabled) {
        playNotificationSound(settingsRef.current.volume);
      }
      showNotification(currentType);

      // Transition to next session
      const nextType = getNextSession(currentType, completedWorkCountRef.current);
      const nextDuration = getDurationRef.current(nextType);
      const newSessionId = crypto.randomUUID();

      sessionIdRef.current = newSessionId;
      targetEndTimeRef.current = null;
      sessionStartRef.current = 0;

      setSessionType(nextType);
      setTimeRemaining(nextDuration);
      setTimerState('idle');

      // Persist idle state for next session
      savePersistedSession({
        version: 1,
        sessionId: newSessionId,
        timerState: 'idle',
        sessionType: nextType,
        targetEndTime: null,
        remainingSeconds: nextDuration,
        startedAt: 0,
        completedWorkCount: completedWorkCountRef.current,
      });
    },
    [getNextSession]
  );

  // Authoritative recalculation of time remaining against Date.now()
  const recalculateTime = useCallback(() => {
    if (timerStateRef.current !== 'running' || !targetEndTimeRef.current) {
      return;
    }

    const now = Date.now();
    const remainingMs = targetEndTimeRef.current - now;

    if (remainingMs <= 0) {
      setTimeRemaining(0);
      completeSession(targetEndTimeRef.current);
    } else {
      const remainingSec = Math.ceil(remainingMs / 1000);
      setTimeRemaining(remainingSec);
    }
  }, [completeSession]);

  // Mount effect: handle potential expired session during cold reload
  useEffect(() => {
    const persisted = loadPersistedSession();
    if (persisted && persisted.timerState === 'running' && persisted.targetEndTime) {
      const now = Date.now();
      if (now >= persisted.targetEndTime) {
        // Completed while tab was closed / unloaded
        completeSession(persisted.targetEndTime);
      } else {
        recalculateTime();
      }
    }
  }, [completeSession, recalculateTime]);

  // Settings change update when idle
  useEffect(() => {
    if (timerState === 'idle') {
      const duration = getDuration(sessionType);
      setTimeRemaining(duration);
      savePersistedSession({
        version: 1,
        sessionId: sessionIdRef.current,
        timerState: 'idle',
        sessionType,
        targetEndTime: null,
        remainingSeconds: duration,
        startedAt: 0,
        completedWorkCount: completedWorkCountRef.current,
      });
    }
  }, [getDuration, sessionType, timerState]);

  // Interval display updater: ticker runs only when running, strictly for visual updates
  useEffect(() => {
    if (timerState === 'running') {
      // Immediate sync
      recalculateTime();

      // Tick frequently to keep UI responsive regardless of browser timer quantization
      intervalRef.current = window.setInterval(() => {
        recalculateTime();
      }, 500);
    }

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState, recalculateTime]);

  // Lifecycle listeners: visibilitychange, focus, pageshow
  useEffect(() => {
    const handleSync = () => {
      if (timerStateRef.current === 'running') {
        recalculateTime();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleSync);
    window.addEventListener('pageshow', handleSync);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('pageshow', handleSync);
    };
  }, [recalculateTime]);

  // Control handlers
  const start = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission();
      } catch {
        // Ignore
      }
    }

    const now = Date.now();
    const durationSec = timeRemainingRef.current > 0 ? timeRemainingRef.current : getDurationRef.current(sessionTypeRef.current);
    const targetEnd = now + durationSec * 1000;
    const newSessionId = sessionIdRef.current || crypto.randomUUID();

    sessionIdRef.current = newSessionId;
    completingSessionIdRef.current = null;
    sessionStartRef.current = now;
    targetEndTimeRef.current = targetEnd;

    setTimerState('running');
    setTimeRemaining(durationSec);

    savePersistedSession({
      version: 1,
      sessionId: newSessionId,
      timerState: 'running',
      sessionType: sessionTypeRef.current,
      targetEndTime: targetEnd,
      remainingSeconds: durationSec,
      startedAt: now,
      completedWorkCount: completedWorkCountRef.current,
    });
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const now = Date.now();
    let remainingSec = timeRemainingRef.current;
    if (targetEndTimeRef.current) {
      const remainingMs = targetEndTimeRef.current - now;
      remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
    }

    targetEndTimeRef.current = null;
    setTimerState('paused');
    setTimeRemaining(remainingSec);

    savePersistedSession({
      version: 1,
      sessionId: sessionIdRef.current,
      timerState: 'paused',
      sessionType: sessionTypeRef.current,
      targetEndTime: null,
      remainingSeconds: remainingSec,
      startedAt: sessionStartRef.current,
      completedWorkCount: completedWorkCountRef.current,
    });
  }, []);

  const resume = useCallback(() => {
    const now = Date.now();
    const remainingSec = timeRemainingRef.current > 0 ? timeRemainingRef.current : getDurationRef.current(sessionTypeRef.current);
    const targetEnd = now + remainingSec * 1000;

    targetEndTimeRef.current = targetEnd;
    completingSessionIdRef.current = null;

    setTimerState('running');
    setTimeRemaining(remainingSec);

    savePersistedSession({
      version: 1,
      sessionId: sessionIdRef.current,
      timerState: 'running',
      sessionType: sessionTypeRef.current,
      targetEndTime: targetEnd,
      remainingSeconds: remainingSec,
      startedAt: sessionStartRef.current,
      completedWorkCount: completedWorkCountRef.current,
    });
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const duration = getDurationRef.current(sessionTypeRef.current);
    const newSessionId = crypto.randomUUID();

    sessionIdRef.current = newSessionId;
    targetEndTimeRef.current = null;
    sessionStartRef.current = 0;
    completingSessionIdRef.current = null;

    setTimerState('idle');
    setTimeRemaining(duration);

    savePersistedSession({
      version: 1,
      sessionId: newSessionId,
      timerState: 'idle',
      sessionType: sessionTypeRef.current,
      targetEndTime: null,
      remainingSeconds: duration,
      startedAt: 0,
      completedWorkCount: completedWorkCountRef.current,
    });
  }, []);

  const skip = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const nextType = getNextSession(sessionTypeRef.current, completedWorkCountRef.current);
    const nextDuration = getDurationRef.current(nextType);
    const newSessionId = crypto.randomUUID();

    sessionIdRef.current = newSessionId;
    targetEndTimeRef.current = null;
    sessionStartRef.current = 0;
    completingSessionIdRef.current = null;

    setSessionType(nextType);
    setTimeRemaining(nextDuration);
    setTimerState('idle');

    savePersistedSession({
      version: 1,
      sessionId: newSessionId,
      timerState: 'idle',
      sessionType: nextType,
      targetEndTime: null,
      remainingSeconds: nextDuration,
      startedAt: 0,
      completedWorkCount: completedWorkCountRef.current,
    });
  }, [getNextSession]);

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
