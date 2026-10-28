import { useState } from 'react';

export default function KeyboardHints() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="keyboard-hints-container">
      <button
        className="icon-btn keyboard-hints-toggle"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        title="Keyboard shortcuts"
        aria-label="Show keyboard shortcuts"
      >
        ?
      </button>

      <div className={`keyboard-hints-tooltip glass-card ${isOpen ? 'open' : ''}`}>
        <div className="shortcut-row">
          <kbd>Space</kbd>
          <span>Start / Pause</span>
        </div>
        <div className="shortcut-row">
          <kbd>R</kbd>
          <span>Reset</span>
        </div>
        <div className="shortcut-row">
          <kbd>S</kbd>
          <span>Skip</span>
        </div>
        <div className="shortcut-row">
          <kbd>D</kbd>
          <span>Dark / Light</span>
        </div>
        <div className="shortcut-row">
          <kbd>M</kbd>
          <span>Next Season</span>
        </div>
      </div>
    </div>
  );
}
