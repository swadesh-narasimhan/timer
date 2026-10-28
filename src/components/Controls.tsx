import type { TimerState } from '../types';

interface ControlsProps {
  timerState: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="3" width="5" height="18" rx="1" />
      <rect x="14" y="3" width="5" height="18" rx="1" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 1 3 6.9" />
      <polyline points="3 7 3 13 9 13" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 15,12 5,21" />
      <rect x="17" y="3" width="3" height="18" rx="1" />
    </svg>
  );
}

export default function Controls({ timerState, onStart, onPause, onResume, onReset, onSkip }: ControlsProps) {
  const handlePlayPause = () => {
    switch (timerState) {
      case 'idle':
        onStart();
        break;
      case 'running':
        onPause();
        break;
      case 'paused':
        onResume();
        break;
    }
  };

  return (
    <div className="controls">
      <button className="control-btn secondary" onClick={onReset} title="Reset (R)" aria-label="Reset timer">
        <ResetIcon />
      </button>
      <button className="control-btn primary" onClick={handlePlayPause} title="Play/Pause (Space)" aria-label={timerState === 'running' ? 'Pause' : 'Start'}>
        {timerState === 'running' ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button className="control-btn secondary" onClick={onSkip} title="Skip (S)" aria-label="Skip session">
        <SkipIcon />
      </button>
    </div>
  );
}
