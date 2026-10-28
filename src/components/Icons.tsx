import type { SVGProps, ReactNode } from 'react';
import type { Season } from '../types';

type IconName = 'chart' | 'settings' | 'help' | 'close' | 'play' | 'pause' | 'reset' | 'skip' | 'sun' | 'moon' | 'chevron' | 'check' | 'rain' | 'summer' | 'spring' | 'winter';
interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> { name: IconName; size?: number }

/** Consistent, dependency-free, Lucide-style SVG iconography. */
export function Icon({ name, size = 20, ...props }: IconProps) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const, focusable: false as const, ...props };
  const shapes: Record<IconName, ReactNode> = {
    chart: <><path d="M3 3v18h18"/><path d="M7 16v-4M12 16V7M17 16v-6"/></>,
    settings: <><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.56V21h-4v-.04A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3v-4h.04A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88L4.2 7.06 7.06 4.2l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3h4v.04A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1H21v4h-.04A1.7 1.7 0 0 0 19.4 15Z"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.9.8-1.7 1.2-1.7 2.7"/><path d="M12 17h.01"/></>,
    close: <path d="M18 6 6 18M6 6l12 12"/>,
    play: <path d="m8 5 11 7-11 7V5Z"/>,
    pause: <><path d="M8 5v14M16 5v14"/></>,
    reset: <><path d="M3 11a9 9 0 1 1 3 7"/><path d="M3 4v7h7"/></>,
    skip: <><path d="m5 5 10 7-10 7V5Z"/><path d="M19 5v14"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    moon: <path d="M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z"/>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    check: <path d="m20 6-11 11-5-5"/>,
    rain: <><path d="M20 15a4 4 0 0 0-1-7.9A7 7 0 0 0 5.3 9 4 4 0 0 0 5 17"/><path d="m8 17-1 3m6-3-1 3m6-3-1 3"/></>,
    summer: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
    spring: <><path d="M12 12C6 9 6 3 12 5c6-2 6 4 0 7Zm0 0c6-3 12 0 7 5 1 6-5 6-7 0-2 6-8 6-7 0-5-5 1-8 7-5Z"/><circle cx="12" cy="12" r="2"/></>,
    winter: <><path d="M12 2v20M4 6l16 12M20 6 4 18M9 5l3 3 3-3M9 19l3-3 3 3"/></>,
  };
  return <svg {...common}>{shapes[name]}</svg>;
}

const seasonIconNames: Record<Season, IconName> = { monsoon: 'rain', summer: 'summer', spring: 'spring', tropicalWinter: 'winter' };
export function SeasonIcon({ season, size = 20 }: { season: Season; size?: number }) {
  return <Icon name={seasonIconNames[season]} size={size} />;
}
