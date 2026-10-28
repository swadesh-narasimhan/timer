import { useState } from 'react';
import type { Settings } from '../types';

interface SettingsProps {
  settings: Settings;
  onUpdate: (settings: Partial<Settings>) => void;
}

export default function SettingsPanel({ settings, onUpdate }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="icon-btn settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Settings"
        aria-label="Open settings"
      >
        ⚙️
      </button>

      {/* Overlay */}
      <div className={`settings-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />

      {/* Panel */}
      <div className={`settings-panel glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={() => setIsOpen(false)} aria-label="Close settings">✕</button>
        </div>

        <div className="settings-content">
          <div className="setting-group">
            <label>
              Work Duration
              <span className="setting-value">{settings.workDuration} min</span>
            </label>
            <input
              type="range"
              min="1"
              max="60"
              value={settings.workDuration}
              onChange={(e) => onUpdate({ workDuration: Number(e.target.value) })}
              className="setting-slider"
            />
          </div>

          <div className="setting-group">
            <label>
              Short Break
              <span className="setting-value">{settings.shortBreakDuration} min</span>
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={settings.shortBreakDuration}
              onChange={(e) => onUpdate({ shortBreakDuration: Number(e.target.value) })}
              className="setting-slider"
            />
          </div>

          <div className="setting-group">
            <label>
              Long Break
              <span className="setting-value">{settings.longBreakDuration} min</span>
            </label>
            <input
              type="range"
              min="1"
              max="60"
              value={settings.longBreakDuration}
              onChange={(e) => onUpdate({ longBreakDuration: Number(e.target.value) })}
              className="setting-slider"
            />
          </div>

          <div className="setting-group">
            <label>
              Long Break Interval
              <span className="setting-value">Every {settings.longBreakInterval} pomodoros</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.longBreakInterval}
              onChange={(e) => onUpdate({ longBreakInterval: Number(e.target.value) })}
              className="setting-slider"
            />
          </div>

          <div className="setting-group">
            <label className="toggle-label">
              Sound
              <button
                className={`toggle-switch ${settings.soundEnabled ? 'active' : ''}`}
                onClick={() => onUpdate({ soundEnabled: !settings.soundEnabled })}
                role="switch"
                aria-checked={settings.soundEnabled}
              >
                <span className="toggle-knob" />
              </button>
            </label>
          </div>

          {settings.soundEnabled && (
            <div className="setting-group">
              <label>
                Volume
                <span className="setting-value">{Math.round(settings.volume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(settings.volume * 100)}
                onChange={(e) => onUpdate({ volume: Number(e.target.value) / 100 })}
                className="setting-slider"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
