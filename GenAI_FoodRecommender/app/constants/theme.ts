// Color Palette - Warm, accessible, and encouraging
export const Colors = {
  primary: '#00a699', // Teal/green
  primaryDark: '#00796b',
  primaryLight: '#26c6da',
  
  secondary: '#ff6b6b', // Soft red for alerts
  success: '#2ecc71', // Green
  warning: '#f39c12', // Amber
  error: '#e74c3c', // Red
  
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceLight: '#f9f9f9',
  
  text: {
    primary: '#1a1a1a',
    secondary: '#666',
    tertiary: '#999',
    inverse: '#ffffff',
  },
  
  border: '#ddd',
  divider: '#eee',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
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

// Border Radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
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
