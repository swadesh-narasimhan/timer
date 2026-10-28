import { Icon } from './Icons';
import { useState, useMemo } from 'react';
import type { PomodoroSession } from '../types';

interface StatsProps {
  sessions: PomodoroSession[];
  totalCompleted: number;
  currentStreak: number;
}

export default function Stats({ sessions, totalCompleted, currentStreak }: StatsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const workSessions = sessions.filter((s) => s.type === 'work');
    const todaySessions = workSessions.filter((s) => s.completedAt >= todayStart);

    const totalFocusMinutes = workSessions.reduce((acc, s) => acc + s.duration / 60, 0);

    // Last 7 days chart data
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
      const count = workSessions.filter((s) => s.completedAt >= dayStart && s.completedAt < dayEnd).length;
      days.push({ label: dayLabel, count });
    }

    const maxCount = Math.max(...days.map((d) => d.count), 1);

    // Best streak calculation
    let bestStreak = 0;
    let tempStreak = 0;
    const sortedWork = [...workSessions].sort((a, b) => a.completedAt - b.completedAt);
    for (let i = 0; i < sortedWork.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const diff = sortedWork[i].completedAt - sortedWork[i - 1].completedAt;
        // Within an hour counts as continuing streak
        if (diff < 3600000) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    return {
      todayCount: todaySessions.length,
      totalFocusHours: Math.floor(totalFocusMinutes / 60),
      totalFocusMinutes: Math.round(totalFocusMinutes % 60),
      bestStreak,
      days,
      maxCount,
    };
  }, [sessions]);

  return (
    <>
      <button
        className="icon-btn stats-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Statistics"
        aria-label="Open statistics"
      >
        <Icon name="chart" />
      </button>

      <div className={`stats-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />

      <div className={`stats-panel glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="stats-header">
          <h2>Statistics</h2>
          <button className="icon-btn" onClick={() => setIsOpen(false)} aria-label="Close statistics" title="Close statistics"><Icon name="close" /></button>
        </div>

        <div className="stats-content">
          <div className="stats-grid">
            <div className="stat-card glass-card">
              <div className="stat-value">{stats.todayCount}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-value">{totalCompleted}</div>
              <div className="stat-label">All Time</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-value">
                {stats.totalFocusHours}h {stats.totalFocusMinutes}m
              </div>
              <div className="stat-label">Focus Time</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-value">{currentStreak} / {stats.bestStreak}</div>
              <div className="stat-label">Streak / Best</div>
            </div>
          </div>

          <div className="chart-section">
            <h3>Last 7 Days</h3>
            <div className="bar-chart">
              {stats.days.map((day, i) => (
                <div key={i} className="bar-col">
                  <div className="bar-wrapper">
                    <div
                      className="bar-fill"
                      style={{ height: `${(day.count / stats.maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="bar-count">{day.count}</span>
                  <span className="bar-label">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
