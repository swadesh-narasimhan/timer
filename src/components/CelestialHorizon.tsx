import { useState, useEffect, useMemo } from 'react';
import type { Season } from '../types';

interface CelestialHorizonProps {
  season: Season;
  theme: 'dark' | 'light';
  previewHour: number | null;
  enabled: boolean;
}

export default function CelestialHorizon({
  season,
  theme,
  previewHour,
  enabled,
}: CelestialHorizonProps) {
  const [currentHour, setCurrentHour] = useState<number>(() => {
    if (previewHour !== null) return previewHour;
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });

  // Track clock every minute if not in preview mode
  useEffect(() => {
    if (previewHour !== null) {
      setCurrentHour(previewHour);
      return;
    }

    const updateTime = () => {
      const now = new Date();
      setCurrentHour(now.getHours() + now.getMinutes() / 60);
    };

    updateTime();
    const timer = setInterval(updateTime, 30000); // Check every 30s
    return () => clearInterval(timer);
  }, [previewHour]);

  // Celestial mechanics
  const { isDay, sunProgress, moonProgress, sunOpacity, moonOpacity, phaseName } = useMemo(() => {
    const hour = currentHour % 24;

    // Day window: 05:30 to 18:30
    const dayStart = 5.5;
    const dayEnd = 18.5;
    const isDayTime = hour >= dayStart && hour < dayEnd;

    // Sun progress (0 at dawn, 0.5 at midday, 1 at dusk)
    let sProg = (hour - dayStart) / (dayEnd - dayStart);
    sProg = Math.max(0, Math.min(1, sProg));

    // Moon progress (0 at dusk, 0.5 at midnight, 1 at dawn)
    let mProg = 0;
    if (hour >= dayEnd) {
      mProg = (hour - dayEnd) / (24 - dayEnd + dayStart);
    } else if (hour < dayStart) {
      mProg = (hour + (24 - dayEnd)) / (24 - dayEnd + dayStart);
    }
    mProg = Math.max(0, Math.min(1, mProg));

    // Opacities with smooth fade in/out near horizon
    let sOpacity = 0;
    let mOpacity = 0;

    if (hour >= 5.0 && hour <= 19.0) {
      if (hour < 6.5) {
        sOpacity = (hour - 5.0) / 1.5; // Fade in at sunrise
      } else if (hour > 17.5) {
        sOpacity = (19.0 - hour) / 1.5; // Fade out at sunset
      } else {
        sOpacity = 1;
      }
    }

    if (hour >= 18.0 || hour <= 6.0) {
      if (hour >= 18.0 && hour < 19.5) {
        mOpacity = (hour - 18.0) / 1.5; // Fade in at moonrise
      } else if (hour > 4.5 && hour <= 6.0) {
        mOpacity = (6.0 - hour) / 1.5; // Fade out at moonset
      } else {
        mOpacity = 1;
      }
    }

    // Time phase description
    let phase = 'Day';
    if (hour >= 5.0 && hour < 7.5) phase = 'Dawn';
    else if (hour >= 7.5 && hour < 16.5) phase = 'Day';
    else if (hour >= 16.5 && hour < 19.0) phase = 'Dusk';
    else phase = 'Night';

    return {
      isDay: isDayTime,
      sunProgress: sProg,
      moonProgress: mProg,
      sunOpacity: Math.max(0, Math.min(1, sOpacity)),
      moonOpacity: Math.max(0, Math.min(1, mOpacity)),
      phaseName: phase,
    };
  }, [currentHour]);

  if (!enabled) return null;

  // Horizon placement at 74% viewport height
  const horizonYPercent = 74;

  // Parabolic trajectory for celestial bodies
  // X travels from 12% to 88% of screen
  // Y reaches maximum height (lowest Y percentage ~22%) at midday / midnight
  const sunX = 12 + sunProgress * 76;
  const sunArc = Math.sin(sunProgress * Math.PI);
  const sunY = horizonYPercent - sunArc * 50;

  const moonX = 14 + moonProgress * 72;
  const moonArc = Math.sin(moonProgress * Math.PI);
  const moonY = horizonYPercent - moonArc * 48;

  // Seasonal & Theme adjustments
  const isDark = theme === 'dark';

  return (
    <div
      className={`celestial-horizon-container ${phaseName.toLowerCase()}`}
      aria-hidden="true"
    >
      {/* Subtle Atmospheric Sky Gradient Overlay */}
      <div className="atmospheric-sky-tint" />

      {/* Sun */}
      {sunOpacity > 0 && (
        <div
          className="celestial-body celestial-sun"
          style={{
            left: `${sunX}%`,
            top: `${sunY}%`,
            opacity: sunOpacity * (isDark ? 0.35 : 0.45),
          }}
        >
          <div className="sun-corona" />
          <div className="sun-disc" />
        </div>
      )}

      {/* Moon */}
      {moonOpacity > 0 && (
        <div
          className="celestial-body celestial-moon"
          style={{
            left: `${moonX}%`,
            top: `${moonY}%`,
            opacity: moonOpacity * (isDark ? 0.45 : 0.35),
          }}
        >
          <div className="moon-glow" />
          <svg
            className="moon-crescent-svg"
            width="38"
            height="38"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              d="M30 20C30 25.5228 25.5228 30 20 30C15.93 30 12.44 27.57 10.92 24.1C11.9 24.36 12.93 24.5 14 24.5C20.3513 24.5 25.5 19.3513 25.5 13C25.5 10.51 24.71 8.21 23.36 6.33C27.27 7.78 30 11.57 30 20Z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}

      {/* Minimalist Horizon Line with soft curved blur */}
      <div className="horizon-wrapper" style={{ top: `${horizonYPercent}%` }}>
        <div className="horizon-glow" />
        <svg
          className="horizon-svg"
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
        >
          {/* Subtle curved earth contour */}
          <path
            d="M0,20 Q500,10 1000,20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </div>
    </div>
  );
}
