/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1D2B33',
    background: '#FFFFFF',
    backgroundElement: '#3a97b9',
    backgroundElementSecondary: '#FCE7D1',
    backgroundSelected: '#ff9647',
    textSecondary: '#f3f3f3',
    textTertiary: '#7A8892',
    accent: '#3A8FBF',
    teal: '#2C7195',
  },
  dark: {
    text: '#EDF6FA',
    background: '#0E1B22',
    backgroundElement: '#1B4A63',
    backgroundElementSecondary: '#FCE7D1',
    backgroundSelected: '#F4A259',
    textSecondary: '#A5D0E4',
    textTertiary: '#7A97A8',
    accent: '#6BB0D2',
    teal: '#F4A259',
  },
};

export type AppColors = typeof Colors.light;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
