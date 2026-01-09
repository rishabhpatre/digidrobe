/**
 * Digidrobe Design System
 * Colors, typography, and spacing constants matching the provided mockups
 */

// Primary brand colors - Soft pink theme targeting 18-27 female audience
export const Colors = {
  light: {
    primary: '#E88B9C',      // Rose pink - main action buttons
    primaryDark: '#D4707F',  // Darker rose for pressed states
    background: '#FDF6F7',   // Soft blush background
    surface: '#ffffff',      // White cards
    textMain: '#2D2A2E',     // Warm dark gray
    textSubtle: '#9B7F86',   // Dusty rose text
    textMuted: '#C4B3B8',    // Light mauve
    border: '#F0E4E6',       // Pale pink border
    accent: '#B88B9E',       // Dusty mauve accent
  },
  dark: {
    primary: '#E88B9C',      // Rose pink
    primaryDark: '#D4707F',  // Deeper rose
    background: '#1E1A1B',   // Deep warm black
    surface: '#2A2426',      // Dark mauve surface
    textMain: '#ffffff',
    textSubtle: '#C4B3B8',
    textMuted: '#9B7F86',
    border: '#3D3537',
    accent: '#B88B9E',
  },
};

// Typography
export const Typography = {
  fontFamily: {
    display: 'System', // Will use Plus Jakarta Sans when loaded
    body: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
};

// Border Radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// Shadows
export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  primaryGlow: {
    shadowColor: '#E88B9C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Clothing categories
export const Categories = [
  { key: 'all', label: 'all' },
  { key: 'tops', label: 'tops' },
  { key: 'bottoms', label: 'bottoms' },
  { key: 'layers', label: 'layers' },
  { key: 'shoes', label: 'shoes' },
  { key: 'accessories', label: 'accs' },
];

// API Configuration - Use your Mac's IP for mobile device testing
// Replace 192.168.1.5 with your Mac's actual IP if different
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.7:5001/api'
  : 'https://your-production-api.com/api';
