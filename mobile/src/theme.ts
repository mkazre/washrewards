// WashRewards SA — design tokens, extracted directly from the prototype
// (WashRewards SA.dc.html). Keep this the single source of visual truth.

export const colors = {
  // Brand
  navy: '#091830',
  navy2: '#0E2347',
  navy3: '#13294f',
  navy4: '#1d3470',
  blue: '#2463EB',
  blueDark: '#1d54ce',
  blueTint: '#F4F7FF',
  blueTint2: '#EEF3FF',
  amber: '#F59E0B',
  amber2: '#FBBF24',
  amberInk: '#B45309',
  amberTint: '#FFF7E8',
  amberTint2: '#FEF3DC',

  // Neutrals / surfaces
  bg: '#F5F6F8',
  surface: '#FFFFFF',
  surface2: '#F7F8FA',
  ink: '#0B1626',
  inkSoft: '#6B7787',
  inkFaint: '#8A95A3',
  inkMute: '#9AA5B1',
  line: '#EEF0F4',
  line2: '#E2E6EC',
  line3: '#ECEEF2',

  // On-navy text
  onNavy: '#FFFFFF',
  onNavyMute: '#9DB0D4',
  onNavyMute2: '#7E8DA6',
  onNavySoft: '#C6D2E8',

  // Semantic
  good: '#16A34A',
  goodTint: '#E7F6EC',
} as const;

export const font = {
  display: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  displayMed: 'SpaceGrotesk_500Medium',
  displayReg: 'SpaceGrotesk_400Regular',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const radius = {
  sm: 11,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const space = (n: number) => n * 4;

// Common shadow presets (iOS shadow* + Android elevation)
export const shadow = {
  card: {
    shadowColor: '#091830',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  soft: {
    shadowColor: '#091830',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  blue: {
    shadowColor: '#2463EB',
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
} as const;
