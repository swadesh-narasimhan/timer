import type { SessionType, TimerState } from '../types';

interface TimerProps {
  timeRemaining: number;
  totalDuration: number;
  timerState: TimerState;
  sessionType: SessionType;
  currentStreak: number;
  longBreakInterval: number;
}

const SESSION_LABELS: Record<SessionType, string> = {
  work: 'Focus Time',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export default function Timer({
  timeRemaining,
  totalDuration,
  timerState,
  sessionType,
  currentStreak,
  longBreakInterval,
}: TimerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = totalDuration > 0 ? (totalDuration - timeRemaining) / totalDuration : 0;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const cycleLength = Math.max(1, longBreakInterval);
  const streakDisplay = currentStreak % cycleLength || (currentStreak > 0 ? cycleLength : 0);

  return (
    <div className={`timer-container session-${sessionType}`}>
      <div className={`timer-circle-wrapper ${timerState === 'running' ? 'pulse-glow' : ''}`}>
        <svg className="timer-svg" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke="var(--ring-bg)"
            strokeWidth="6"
            opacity="0.3"
          />
          {/* Progress circle */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke="var(--ring-color)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 160 160)"
            className="progress-ring"
          />
        </svg>
        <div className="timer-content">
          <div className="timer-time">{timeStr}</div>
          <div className="timer-label">{SESSION_LABELS[sessionType]}</div>
          <div className="timer-streak" role="group" aria-label={`${streakDisplay} of ${cycleLength} focus sessions completed in this cycle`} title={`${streakDisplay} of ${cycleLength} focus sessions completed`}>
            {Array.from({ length: cycleLength }, (_, i) => (
              <span key={i} className={`session-dot ${i < streakDisplay ? 'completed' : ''}`} aria-hidden="true" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
