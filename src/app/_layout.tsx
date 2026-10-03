import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import OnboardingModal from '@/components/onboarding/onboarding-modal';
import { supabase } from '@/utils/supabase';
import { getHasOnboarded } from '@/utils/storage';
import { TextSizeProvider } from '@/context/TextSizeContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }
      const hasOnboarded = await getHasOnboarded();
      if (!hasOnboarded) {
        setShowOnboarding(true);
      }
    }
    init();
  }, []);

  return (
      <TextSizeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <AppTabs />
          <OnboardingModal
              visible={showOnboarding}
              onDismiss={() => setShowOnboarding(false)}
          />
        </ThemeProvider>
      </TextSizeProvider>
  );
}