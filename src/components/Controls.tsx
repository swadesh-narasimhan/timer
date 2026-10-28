import { Icon } from './Icons';
import type { TimerState } from '../types';

interface ControlsProps {
  timerState: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
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
        <Icon name="reset" />
      </button>
      <button className="control-btn primary" onClick={handlePlayPause} title={`${timerState === 'running' ? 'Pause' : timerState === 'paused' ? 'Resume' : 'Start'} timer (Space)`} aria-label={timerState === 'running' ? 'Pause timer' : timerState === 'paused' ? 'Resume timer' : 'Start timer'}>
        {timerState === 'running' ? <Icon name="pause" size={24} /> : <Icon name="play" size={24} />}
      </button>
      <button className="control-btn secondary" onClick={onSkip} title="Skip to next session (S)" aria-label="Skip to next session">
        <Icon name="skip" />
      </button>
    </div>
  );
}
