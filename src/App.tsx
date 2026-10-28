import { useCallback } from 'react';
import { useAppContext } from './context/AppContext';
import useTimer from './hooks/useTimer';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import SeasonalEffect from './components/SeasonalEffect';
import CelestialHorizon from './components/CelestialHorizon';
import SeasonPicker from './components/SeasonPicker';
import Timer from './components/Timer';
import Controls from './components/Controls';
import SettingsPanel from './components/Settings';
import Stats from './components/Stats';
import ThemeToggle from './components/ThemeToggle';
import KeyboardHints from './components/KeyboardHints';
import type { PomodoroSession } from './types';
import './App.css';

export default function App() {
  const {
    state,
    theme,
    season,
    setSeason,
    nextSeason,
    updateSettings,
    addSession,
    toggleTheme,
  } = useAppContext();

  const handleSessionComplete = useCallback(
    (session: PomodoroSession) => {
      addSession(session);
    },
    [addSession]
  );

  const {
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
  } = useTimer(state.settings, handleSessionComplete);

  const handleToggleTimer = useCallback(() => {
    switch (timerState) {
      case 'idle':
        start();
        break;
      case 'running':
        pause();
        break;
      case 'paused':
        resume();
        break;
    }
  }, [timerState, start, pause, resume]);

  useKeyboardShortcuts({
    onToggleTimer: handleToggleTimer,
    onReset: reset,
    onSkip: skip,
    onToggleTheme: toggleTheme,
    onNextSeason: nextSeason,
  });

  return (
    <div className={`app ${theme}`} data-session={sessionType} data-season={season}>
      <div className="background-gradient" />
      <CelestialHorizon
        season={season}
        theme={theme}
        previewHour={state.settings.previewHour}
        enabled={state.settings.timeOfDayEnabled}
      />
      <SeasonalEffect season={season} />

      <div className="app-header">
        <div className="header-left">
          <Stats
            sessions={state.sessions}
            totalCompleted={state.totalCompleted}
            currentStreak={currentStreak}
          />
        </div>
        <div className="header-right">
          <SeasonPicker
            currentSeason={season}
            autoCycle={state.settings.autoCycleSeasons}
            onSelectSeason={setSeason}
            onToggleAutoCycle={(auto) => updateSettings({ autoCycleSeasons: auto })}
          />
          <SettingsPanel settings={state.settings} onUpdate={updateSettings} />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </div>

      <main className="app-main">
        <Timer
          timeRemaining={timeRemaining}
          totalDuration={totalDuration}
          timerState={timerState}
          sessionType={sessionType}
          currentStreak={currentStreak}
          longBreakInterval={state.settings.longBreakInterval}
        />
        <Controls
          timerState={timerState}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onReset={reset}
          onSkip={skip}
        />
      </main>

      <div className="app-footer">
        <KeyboardHints />
      </div>
    </div>
  );
}
