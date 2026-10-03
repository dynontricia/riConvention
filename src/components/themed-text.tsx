import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTextSize } from '@/context/TextSizeContext';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code' | 'defaultSemiBold';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { fontScale } = useTextSize();

  const shouldScale = type !== 'title' && type !== 'subtitle' && type !== 'code';

  return (
      <Text
          style={[
            { color: theme[themeColor ?? 'text'] },
            type === 'default' && styles.default,
            type === 'title' && styles.title,
            type === 'small' && styles.small,
            type === 'smallBold' && styles.smallBold,
            type === 'subtitle' && styles.subtitle,
            type === 'link' && styles.link,
            type === 'linkPrimary' && styles.linkPrimary,
            type === 'code' && styles.code,
            type === 'defaultSemiBold' && styles.defaultSemiBold,
            // Apply font scale on top of base styles
            shouldScale && {
              fontSize: getBaseFontSize(type) * fontScale,
              lineHeight: getBaseLineHeight(type) * fontScale,
            },
            style,
          ]}
          {...rest}
      />
  );
}

function getBaseFontSize(type: ThemedTextProps['type']): number {
  switch (type) {
    case 'small':
    case 'smallBold':
    case 'link':
    case 'linkPrimary':
      return 14;
    case 'default':
    case 'defaultSemiBold':
    default:
      return 16;
  }
}

function getBaseLineHeight(type: ThemedTextProps['type']): number {
  switch (type) {
    case 'small':
    case 'smallBold':
      return 20;
    case 'link':
    case 'linkPrimary':
      return 30;
    case 'default':
    case 'defaultSemiBold':
    default:
      return 24;
  }
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  title: {
    fontSize: 48,
    fontWeight: '600',
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '600',
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts?.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
});