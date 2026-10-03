import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { getUserName } from '@/utils/storage';
import { getProfile } from '@/utils/queries/profile';
import { fetchUpcomingFavorites } from '@/utils/queries/home';
import { ScheduleEvent } from '@/utils/queries/schedule';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [homeGroup, setHomeGroup] = useState('');
  const [servicePositions, setServicePositions] = useState<string[]>([]);
  const [upcomingFavorites, setUpcomingFavorites] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
      useCallback(() => {
        async function load() {
          try {
            const [name, profile, favorites] = await Promise.all([
              getUserName(),
              getProfile(),
              fetchUpcomingFavorites(),
            ]);
            setFirstName(name.firstName);
            setHomeGroup(profile?.home_group ?? '');
            setServicePositions(profile?.current_service_position ?? []);
            setUpcomingFavorites(favorites);
          } finally {
            setLoading(false);
          }
        }
        load();
      }, [])
  );

  const greeting = firstName ? `Welcome, ${firstName}!` : 'Welcome!';
  const subtitle = [
    homeGroup ? `Group: ${homeGroup}` : null,
    servicePositions.length > 0 ? servicePositions.slice(0, 2).join(' · ') : null,
  ].filter(Boolean).join(' · ');

  return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>

            {/* Hero */}
            <View style={styles.hero}>
              <ThemedText type="title" style={styles.heroTitle}>2027 R.I. State Convention!!</ThemedText>
              <ThemedText type="subtitle">{greeting}</ThemedText>
              {subtitle ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                    {subtitle}
                  </ThemedText>
              ) : null}
            </View>

            {/* My Agenda */}
            <Section title="MY AGENDA">
              {loading ? (
                  <ActivityIndicator />
              ) : upcomingFavorites.length === 0 ? (
                  <ThemedView
                      type="backgroundElement"
                      style={styles.emptyCard}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                      No upcoming favorites yet.{'\n'}Star sessions on the Schedule tab to add them here.
                    </ThemedText>
                    <TouchableOpacity
                        onPress={() => router.push('/schedule')}
                        style={[styles.linkButton, { backgroundColor: colors.backgroundSelected }]}>
                      <ThemedText type="small" style={{ fontWeight: '600' }}>
                        Browse Schedule →
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
              ) : (
                  <View style={{ gap: Spacing.two }}>
                    {upcomingFavorites.map((event) => (
                        <AgendaCard key={event.id}
                                    event={event}
                                    colors={colors}></AgendaCard>
                    ))}
                  </View>
              )}
            </Section>

            {/* Quick Links */}
            <Section title="QUICK LINKS">
              <View style={{ gap: Spacing.two }}>
                <QuickLink
                    emoji="🗺️"
                    label="Event Guide"
                    onPress={() => router.push('/event-guide')}
                    colors={colors}
                />
                <QuickLink
                    emoji="📝"
                    label="Submit Feedback"
                    onPress={() => router.push('/event-guide')}
                    colors={colors}
                />
                <QuickLink
                    emoji=""
                    label="Settings"
                    onPress={() => router.push('/event-guide')}
                    colors={colors}
                />
              </View>
            </Section>

          </ScrollView>
        </SafeAreaView>
      </ThemedView>
  );
}

// ─── SECTION ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
      <View style={styles.section}>
        <ThemedText type="small" style={styles.sectionTitle}>{title}</ThemedText>
        {children}
      </View>
  );
}

// ─── AGENDA CARD ─────────────────────────────────────────────────────────────

function AgendaCard({ event, colors }: { event: ScheduleEvent; colors: typeof Colors.light }) {
  const start = new Date(event.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const day = new Date(event.start_time).toLocaleDateString('en-US', {
    weekday: 'short',
  });

  return (
      <View style={[styles.agendaCard, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.agendaCardLeft}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {day} · {start}
          </ThemedText>
          <ThemedText type="defaultSemiBold" numberOfLines={2}>{event.title}</ThemedText>
          {event.location && (
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                {event.location.address_name ?? event.location.location_name}
              </ThemedText>
          )}
        </View>
        <ThemedText style={styles.star}>⭐</ThemedText>
      </View>
  );
}

// ─── QUICK LINK ──────────────────────────────────────────────────────────────

function QuickLink({
                     emoji,
                     label,
                     onPress,
                     colors,
                   }: {
  emoji: string;
  label: string;
  onPress: () => void;
  colors: typeof Colors.light;
}) {
  return (
      <TouchableOpacity
          onPress={onPress}
          style={[styles.quickLink, { backgroundColor: colors.backgroundElement }]}>
        <ThemedText style={styles.quickLinkEmoji}>{emoji}</ThemedText>
        <ThemedText type="small" style={{ flex: 1, fontWeight: '600' }}>{label}</ThemedText>
        <ThemedText style={{ color: colors.textSecondary }}>›</ThemedText>
      </TouchableOpacity>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  heroTitle: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  emptyCard: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: Spacing.three,
  },
  linkButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  agendaCard: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  agendaCardLeft: {
    flex: 1,
    gap: Spacing.half,
  },
  star: {
    fontSize: 18,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  quickLinkEmoji: {
    fontSize: 20,
  },
});