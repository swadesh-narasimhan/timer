import { useState, useRef, useEffect } from 'react';
import type { Season } from '../types';
import { SEASONS, SEASON_LABELS } from '../context/AppContext';

interface SeasonPickerProps {
  currentSeason: Season;
  autoCycle: boolean;
  onSelectSeason: (season: Season) => void;
  onToggleAutoCycle: (enabled: boolean) => void;
}

export default function SeasonPicker({
  currentSeason,
  autoCycle,
  onSelectSeason,
  onToggleAutoCycle,
}: SeasonPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const activeLabel = SEASON_LABELS[currentSeason];

  return (
    <div className="season-picker-container" ref={containerRef}>
      <button
        className="season-picker-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Current season: ${activeLabel.name}. Click to change season.`}
        title="Change Season & Atmosphere"
      >
        <span className="season-icon" role="img" aria-hidden="true">
          {activeLabel.icon}
        </span>
        <span className="season-name">{activeLabel.name}</span>
        {autoCycle && <span className="season-auto-badge" title="Auto-cycles on Pomodoro completion">Auto</span>}
        <svg
          className={`season-chevron ${isOpen ? 'open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="season-dropdown">
          <div className="season-dropdown-header">
            <span>Atmosphere & Season</span>
          </div>

          <div className="season-options-list">
            {SEASONS.map((s) => {
              const info = SEASON_LABELS[s];
              const isSelected = s === currentSeason;
              return (
                <button
                  key={s}
                  className={`season-option-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectSeason(s);
                    setIsOpen(false);
                  }}
                >
                  <span className="season-option-icon">{info.icon}</span>
                  <div className="season-option-details">
                    <span className="season-option-name">{info.name}</span>
                    <span className="season-option-desc">{info.description}</span>
                  </div>
                  {isSelected && (
                    <svg
                      className="season-check-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="season-dropdown-footer">
            <label className="season-auto-toggle">
              <input
                type="checkbox"
                checked={autoCycle}
                onChange={(e) => onToggleAutoCycle(e.target.checked)}
              />
              <span className="season-toggle-label">
                <strong>Auto-cycle seasons</strong>
                <small>Move to next season after each focus session</small>
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
