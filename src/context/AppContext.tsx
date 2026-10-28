import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { Settings, PomodoroSession, AppState } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

interface AppContextType {
  state: AppState;
  theme: 'dark' | 'light';
  updateSettings: (settings: Partial<Settings>) => void;
  addSession: (session: PomodoroSession) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorage<AppState>('pomodoro-state', {
    settings: DEFAULT_SETTINGS,
    sessions: [],
    currentStreak: 0,
    totalCompleted: 0,
  });

  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('pomodoro-theme', 'dark');

  const updateSettings = useCallback(
    (partial: Partial<Settings>) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...partial },
      }));
    },
    [setState]
  );

  const addSession = useCallback(
    (session: PomodoroSession) => {
      setState((prev) => ({
        ...prev,
        sessions: [...prev.sessions, session],
        totalCompleted: session.type === 'work' ? prev.totalCompleted + 1 : prev.totalCompleted,
        currentStreak: session.type === 'work' ? prev.currentStreak + 1 : prev.currentStreak,
      }));
    },
    [setState]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  return (
    <AppContext.Provider value={{ state, theme, updateSettings, addSession, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
