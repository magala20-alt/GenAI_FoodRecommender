import { Dimensions, PixelRatio } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const BASE_WIDTH = 390
const BASE_HEIGHT = 844
const MIN_SCALE = 0.92
const MAX_SCALE = 1.12

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

const widthScaleFactor = clamp(SCREEN_WIDTH / BASE_WIDTH, MIN_SCALE, MAX_SCALE)
const heightScaleFactor = clamp(SCREEN_HEIGHT / BASE_HEIGHT, MIN_SCALE, MAX_SCALE)

const roundToNearestPixel = (value: number): number => {
  return PixelRatio.roundToNearestPixel(value)
}

export const scale = (size: number): number => {
  return roundToNearestPixel(size * widthScaleFactor)
}

export const verticalScale = (size: number): number => {
  return roundToNearestPixel(size * heightScaleFactor)
}

export const moderateScale = (size: number, factor = 0.5): number => {
  return roundToNearestPixel(size + (scale(size) - size) * factor)
}

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
  surfaceLight: '#F9FAFB',
  error: '#EF4444',
  
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
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(24),
  xxl: scale(32),
}

// Typography
export const Typography = {
  sizes: {
    h1: moderateScale(32, 0.45),
    h2: moderateScale(28, 0.45),
    h3: moderateScale(24, 0.45),
    h4: moderateScale(20, 0.45),
    body: moderateScale(16, 0.4),
    bodySmall: moderateScale(14, 0.4),
    caption: moderateScale(12, 0.35),
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
  sm: scale(4),
  md: scale(8),
  lg: scale(12),
  xl: scale(16),    // Main card radius (generous, rounded)
  xxl: scale(20),
  circular: 999,
}

// Shadow
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(3),
    elevation: scale(2),
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: scale(5),
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(8) },
    shadowOpacity: 0.15,
    shadowRadius: scale(16),
    elevation: scale(8),
  },
}

// Animation durations (ms)
export const Duration = {
  fast: 150,
  base: 300,
  slow: 500,
}
