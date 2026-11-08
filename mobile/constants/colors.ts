// Text-safe variants (`*Text`) exist because the brand/status fills are too light
// to use as text on white or tinted surfaces (WCAG AA 4.5:1). Use `colors.successText`
// etc. for text and icons; use `colors.success` for fills and borders.
export const Colors = {
  light: {
    primary: '#5B5EF0',        // Indigo (fills, buttons) - white text is 4.9:1
    primaryLight: '#818CF8',   // Light Indigo
    primaryDark: '#4F46E5',    // Dark Indigo
    primarySoft: '#E0E7FF',    // Tinted container behind primary icons
    primaryText: '#4F46E5',    // Links and primary-coloured text on surfaces
    onPrimary: '#FFFFFF',      // Text/icons on primary fills
    secondary: '#0F172A',      // Deep Navy
    secondaryLight: '#E2E8F0',
    accent: '#14B8A6',         // Teal
    accentLight: '#5EEAD4',    // Light Teal
    gold: '#FACC15',           // Gold
    background: '#F8FAFC',     // Soft gray background
    surface: '#FFFFFF',        // Card/surface background
    surfaceElevated: '#FFFFFF',// Tab bar, headers, sheets
    surfaceVariant: '#F1F5F9', // Quiet fill for icon buttons and chips
    inputBackground: '#FFFFFF',// Input background
    text: '#0F172A',
    textSecondary: '#556579',
    textTertiary: '#64748B',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    errorText: '#B91C1C',
    success: '#10B981',
    successLight: '#D1FAE5',
    successText: '#047857',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningText: '#92400E',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    infoText: '#1D4ED8',
    overlay: 'rgba(15, 23, 42, 0.5)',
  },
  dark: {
    primary: '#5B5EF0',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    primarySoft: '#312E81',
    primaryText: '#A5B4FC',
    onPrimary: '#FFFFFF',
    secondary: '#334155',
    secondaryLight: '#475569',
    accent: '#14B8A6',
    accentLight: '#5EEAD4',
    gold: '#FACC15',
    background: '#0F172A',     // Deep navy background
    surface: '#1E293B',        // Elevated surface
    surfaceElevated: '#243047',// Tab bar, headers, sheets sit above cards
    surfaceVariant: '#2A3850',
    inputBackground: '#1E293B',// Input background
    text: '#F1F5F9',
    textSecondary: '#A3B1C6',
    textTertiary: '#8494AB',
    border: '#334155',
    borderLight: '#263449',
    error: '#EF4444',
    errorLight: '#7F1D1D',
    errorText: '#F87171',
    success: '#10B981',
    successLight: '#064E3B',
    successText: '#34D399',
    warning: '#F59E0B',
    warningLight: '#78350F',
    warningText: '#FBBF24',
    info: '#3B82F6',
    infoLight: '#1E3A8A',
    infoText: '#93C5FD',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Minimum interactive size (Apple HIG 44pt, Material 48dp).
export const MIN_TOUCH_TARGET = 44;

// Slop that lifts a smaller visual control to the minimum touch target.
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

// The floating tab bar (see app/(tabs)/_layout.tsx) is absolutely positioned,
// so scrolling content must reserve this much space beneath it.
export const TAB_BAR_HEIGHT = 70;
export const TAB_BAR_MARGIN = 20;
