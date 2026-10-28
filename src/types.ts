export type TimerState = 'idle' | 'running' | 'paused';

export type SessionType = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSession {
  id: string;
  type: SessionType;
  startedAt: number;
  completedAt: number;
  duration: number;
  taskLabel?: string;
}

export interface Settings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  soundEnabled: boolean;
  volume: number;
}

export interface AppState {
  settings: Settings;
  sessions: PomodoroSession[];
  currentStreak: number;
  totalCompleted: number;
}

export const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  volume: 0.7,
};
