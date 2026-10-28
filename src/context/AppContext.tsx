import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import type { Settings, PomodoroSession, AppState, Season } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

export const SEASONS: Season[] = ['monsoon', 'summer', 'spring', 'tropicalWinter'];

export const SEASON_LABELS: Record<Season, { name: string; icon: string; description: string }> = {
  monsoon: {
    name: 'Indian Monsoon',
    icon: '🌧️',
    description: 'Refreshing torrential rains, petrichor essence & cozy deep slate greens',
  },
  summer: {
    name: 'Summer',
    icon: '☀️',
    description: 'Warm golden sunrays, glowing dusk motes & energetic terracotta tones',
  },
  spring: {
    name: 'Spring',
    icon: '🌸',
    description: 'Blossoming cherry & jasmine petals dancing gently in fresh breeze',
  },
  tropicalWinter: {
    name: 'Tropical Winter',
    icon: '❄️',
    description: 'Crisp morning mist, cool coastal twilight dew & tranquil deep cyan',
  },
};

interface AppContextType {
  state: AppState;
  theme: 'dark' | 'light';
  season: Season;
  setSeason: (season: Season) => void;
  nextSeason: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  addSession: (session: PomodoroSession) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [rawState, setState] = useLocalStorage<AppState>('pomodoro-state', {
    settings: DEFAULT_SETTINGS,
    sessions: [],
    currentStreak: 0,
    totalCompleted: 0,
  });

  // Ensure any missing settings from older localStorage versions get default values
  const state = useMemo<AppState>(() => ({
    ...rawState,
    settings: {
      ...DEFAULT_SETTINGS,
      ...rawState.settings,
    },
  }), [rawState]);

  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('pomodoro-theme', 'dark');

  const updateSettings = useCallback(
    (partial: Partial<Settings>) => {
      setState((prev) => ({
        ...prev,
        settings: { ...DEFAULT_SETTINGS, ...prev.settings, ...partial },
      }));
    },
    [setState]
  );

  const season = state.settings.season || 'monsoon';

  const setSeason = useCallback(
    (newSeason: Season) => {
      updateSettings({ season: newSeason });
    },
    [updateSettings]
  );

  const nextSeason = useCallback(() => {
    const currentIndex = SEASONS.indexOf(season);
    const nextIndex = (currentIndex + 1) % SEASONS.length;
    setSeason(SEASONS[nextIndex]);
  }, [season, setSeason]);

  const addSession = useCallback(
    (session: PomodoroSession) => {
      setState((prev) => {
        const mergedSettings = { ...DEFAULT_SETTINGS, ...prev.settings };
        let nextSeasonValue = mergedSettings.season;

        if (mergedSettings.autoCycleSeasons && session.type === 'work') {
          const currentIndex = SEASONS.indexOf(mergedSettings.season);
          nextSeasonValue = SEASONS[(currentIndex + 1) % SEASONS.length];
        }

        return {
          ...prev,
          settings: {
            ...mergedSettings,
            season: nextSeasonValue,
          },
          sessions: [...prev.sessions, { ...session, season: mergedSettings.season }],
          totalCompleted: session.type === 'work' ? prev.totalCompleted + 1 : prev.totalCompleted,
          currentStreak: session.type === 'work' ? prev.currentStreak + 1 : prev.currentStreak,
        };
      });
    },
    [setState]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  return (
    <AppContext.Provider
      value={{
        state,
        theme,
        season,
        setSeason,
        nextSeason,
        updateSettings,
        addSession,
        toggleTheme,
      }}
    >
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
