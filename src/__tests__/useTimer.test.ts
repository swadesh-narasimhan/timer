import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTimer, { TIMER_STORAGE_KEY, loadPersistedSession } from '../hooks/useTimer';
import { DEFAULT_SETTINGS, type PomodoroSession, type Settings } from '../types';

describe('useTimer Hook - Absolute Deadline & Safari Background Persistence', () => {
  const mockSettings: Settings = {
    ...DEFAULT_SETTINGS,
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    soundEnabled: false,
  };

  let onSessionCompleteMock = vi.fn((_session: PomodoroSession) => {});

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T12:00:00.000Z'));
    localStorage.clear();
    onSessionCompleteMock = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. Initializes in idle state with correct total duration', () => {
    const { result } = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    expect(result.current.timerState).toBe('idle');
    expect(result.current.sessionType).toBe('work');
    expect(result.current.timeRemaining).toBe(25 * 60); // 1500 seconds
    expect(result.current.totalDuration).toBe(25 * 60);
  });

  it('2. Computes an absolute deadline on start and ignores interval throttling', () => {
    const { result } = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    act(() => {
      result.current.start();
    });

    expect(result.current.timerState).toBe('running');
    expect(result.current.timeRemaining).toBe(1500);

    // Verify localStorage has targetEndTime set 25 min in future
    const persisted = loadPersistedSession();
    expect(persisted).not.toBeNull();
    expect(persisted?.timerState).toBe('running');
    expect(persisted?.targetEndTime).toBe(new Date('2026-10-28T12:00:00.000Z').getTime() + 1500 * 1000);

    // Simulate Safari background throttle: 10 minutes pass without standard 1-second intervals firing
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000); // 600s
    });

    // Time remaining should be exactly 15 minutes (900 seconds)
    expect(result.current.timeRemaining).toBe(15 * 60);
    expect(onSessionCompleteMock).not.toHaveBeenCalled();
  });

  it('3. Recalculates remaining time on visibilitychange, focus, and pageshow events', () => {
    const { result } = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    act(() => {
      result.current.start();
    });

    // Advance clock by 400 seconds silently (simulating device sleep or frozen interval)
    vi.setSystemTime(new Date('2026-10-28T12:06:40.000Z'));

    // Trigger visibilitychange event
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.timeRemaining).toBe(1500 - 400);

    // Advance clock by another 100 seconds
    vi.setSystemTime(new Date('2026-10-28T12:08:20.000Z'));

    // Trigger focus event
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.timeRemaining).toBe(1500 - 500);

    // Trigger pageshow event
    vi.setSystemTime(new Date('2026-10-28T12:10:00.000Z'));
    act(() => {
      window.dispatchEvent(new Event('pageshow'));
    });

    expect(result.current.timeRemaining).toBe(1500 - 600);
  });

  it('4. Freezes time accurately during pause and computes fresh deadline on resume', () => {
    const { result } = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    act(() => {
      result.current.start();
    });

    // Run for 300 seconds (5 min)
    act(() => {
      vi.advanceTimersByTime(300 * 1000);
    });

    expect(result.current.timeRemaining).toBe(1200);

    // Pause timer
    act(() => {
      result.current.pause();
    });

    expect(result.current.timerState).toBe('paused');
    expect(result.current.timeRemaining).toBe(1200);

    // Verify localStorage has targetEndTime: null and remainingSeconds: 1200
    const persistedPaused = loadPersistedSession();
    expect(persistedPaused?.timerState).toBe('paused');
    expect(persistedPaused?.targetEndTime).toBeNull();
    expect(persistedPaused?.remainingSeconds).toBe(1200);

    // Sleep for 1 hour while paused
    act(() => {
      vi.advanceTimersByTime(3600 * 1000);
    });

    // Time remaining should still be 1200
    expect(result.current.timeRemaining).toBe(1200);

    // Resume timer
    act(() => {
      result.current.resume();
    });

    expect(result.current.timerState).toBe('running');
    expect(result.current.timeRemaining).toBe(1200);

    // Advance 200 seconds while running
    act(() => {
      vi.advanceTimersByTime(200 * 1000);
    });

    expect(result.current.timeRemaining).toBe(1000);
  });

  it('5. Restores a running session seamlessly after tab reload / unmount', () => {
    // 1st tab instance
    const hook1 = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    act(() => {
      hook1.result.current.start();
    });

    // 500 seconds elapse
    act(() => {
      vi.advanceTimersByTime(500 * 1000);
    });

    expect(hook1.result.current.timeRemaining).toBe(1000);

    // Simulate tab close / unmount
    hook1.unmount();

    // Advance 200 seconds while tab was closed
    vi.advanceTimersByTime(200 * 1000);

    // Simulate new tab open / restore
    const hook2 = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    expect(hook2.result.current.timerState).toBe('running');
    expect(hook2.result.current.sessionType).toBe('work');
    expect(hook2.result.current.timeRemaining).toBe(800); // 1500 - 500 - 200
  });

  it('6. Restores a paused session after tab reload', () => {
    const hook1 = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    act(() => {
      hook1.result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(400 * 1000);
    });
    act(() => {
      hook1.result.current.pause();
    });

    expect(hook1.result.current.timeRemaining).toBe(1100);
    hook1.unmount();

    // Reopen tab after some time
    vi.advanceTimersByTime(1000 * 1000);

    const hook2 = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    expect(hook2.result.current.timerState).toBe('paused');
    expect(hook2.result.current.timeRemaining).toBe(1100);
  });

  it('7. Handles expired deadlines during tab suspension or page restoration', () => {
    const hook1 = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    act(() => {
      hook1.result.current.start();
    });

    hook1.unmount();

    // Clock advances by 30 minutes (session was 25 min)
    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });

    // Mount page after expiration
    const hook2 = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    // Session completion should be dispatched
    expect(onSessionCompleteMock).toHaveBeenCalledTimes(1);
    const completedSession = onSessionCompleteMock.mock.calls[0][0];
    expect(completedSession.type).toBe('work');
    expect(completedSession.duration).toBe(25 * 60);

    // Should transition to shortBreak in idle state
    expect(hook2.result.current.sessionType).toBe('shortBreak');
    expect(hook2.result.current.timerState).toBe('idle');
    expect(hook2.result.current.timeRemaining).toBe(5 * 60);
  });

  it('8. Prevents duplicate completions when multiple lifecycle events fire at expiration', () => {
    const { result } = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    act(() => {
      result.current.start();
    });

    // Advance exactly to deadline
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    // Simulate flood of concurrent events
    act(() => {
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('pageshow'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Must be called exactly ONCE
    expect(onSessionCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('9. Correctly resets timer and skips to next session', () => {
    const { result } = renderHook(() => useTimer(mockSettings, onSessionCompleteMock));

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(300 * 1000);
    });

    expect(result.current.timeRemaining).toBe(1200);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.timerState).toBe('idle');
    expect(result.current.timeRemaining).toBe(1500);

    // Skip to next session
    act(() => {
      result.current.skip();
    });

    expect(result.current.sessionType).toBe('shortBreak');
    expect(result.current.timerState).toBe('idle');
    expect(result.current.timeRemaining).toBe(5 * 60);
  });
});
