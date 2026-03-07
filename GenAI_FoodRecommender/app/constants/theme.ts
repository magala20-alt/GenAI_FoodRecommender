// Color Palette - Warm, encouraging, and human
// Design: Soft palette with warm white background, teal accent, gentle amber warnings
export const Colors = {
  // Primary (Teal - main accent, warm and welcoming)
  primary: '#0D9488',      // Main teal accent
  primaryDark: '#0A7F74',   // Darker teal for pressed states
  primaryLight: '#2DD4BF',  // Lighter teal for hover/focus
  primaryTint: '#E0F2F1',   // Very light teal background
  
  // Secondary (Warm amber for warnings and highlights)
  secondary: '#F59E0B',     // Warm amber
  secondaryLight: '#FBBF24',
  secondaryTint: '#FFFBEB', // Very light amber background
  
  // Neutral - Warm, soft palette
  white: '#FFFFFF',
  warmWhite: '#FAFAF9',     // Soft warm white (main background)
  light: '#F9FAFB',         // Off-white
  lightGray: '#E5E7EB',     // Light gray for borders
  gray: '#9CA3AF',          // Medium gray for secondary text
  darkGray: '#6B7280',      // Darker gray
  dark: '#374151',          // Dark text
  darkest: '#1F2937',       // Darkest text
  
  // Status colors
  success: '#10B981',
  successTint: '#ECFDF5',
  warning: '#F59E0B',
  warningTint: '#FFFBEB',
  danger: '#EF4444',
  dangerTint: '#FEF2F2',
  
  // Text (encouraging, warm tone)
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // UI Elements
  border: '#E5E7EB',
  divider: '#F3F4F6',
  
  // Overlays (for modals, dimming)
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Backgrounds (warm, soft)
  background: '#FAFAF9',
  surface: '#FFFFFF',
  surfaceHover: '#F9FAFB',
}

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
}

// Typography
export const Typography = {
  sizes: {
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    body: 16,
    bodySmall: 14,
    caption: 12,
  },
  weights: {
    regular: '400',
    medium: '600',
    semibold: '600',
    bold: '700',
  },
}

// Border Radius - Rounded, friendly design (16 is main for cards)
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,    // Main card radius (generous, rounded)
  xxl: 20,
  circular: 999,
}

// Shadow
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
}

// Animation durations (ms)
export const Duration = {
  fast: 150,
  base: 300,
  slow: 500,
}
