import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { fetchSchedule, DaySchedule, ScheduleEvent } from '@/utils/queries/schedule';
import { fetchFavorites, addFavorite, removeFavorite } from '@/utils/queries/favorites';

export default function ScheduleScreen() {
    const scheme = useColorScheme();
    const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

    const [days, setDays] = useState<DaySchedule[]>([]);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<number[]>([]);

    useEffect(() => {
        Promise.all([fetchSchedule(), fetchFavorites()])
            .then(([scheduleData, favoritesData]) => {
                setDays(scheduleData);
                setFavorites(favoritesData);
                if (scheduleData.length > 0) setSelectedDay(scheduleData[0].date);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleToggleFavorite = async (eventId: number) => {
        const isFavorited = favorites.includes(eventId);

        // Optimistic update — change UI immediately, sync to DB after
        setFavorites((prev) =>
            isFavorited ? prev.filter((id) => id !== eventId) : [...prev, eventId]
        );

        try {
            if (isFavorited) {
                await removeFavorite(eventId);
            } else {
                await addFavorite(eventId);
            }
        } catch (err) {
            // Revert if DB call fails
            setFavorites((prev) =>
                isFavorited ? [...prev, eventId] : prev.filter((id) => id !== eventId)
            );
        }
    };

    const currentDay = days.find((d) => d.date === selectedDay);

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator />
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText>Error: {error}</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>

                {/* Day tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabBar}
                    contentContainerStyle={styles.tabBarContent}>
                    {days.map((day) => {
                        const isSelected = day.date === selectedDay;
                        return (
                            <TouchableOpacity
                                key={day.date}
                                onPress={() => setSelectedDay(day.date)}
                                style={[
                                    styles.tab,
                                    { backgroundColor: isSelected ? colors.backgroundSelected : colors.backgroundElement },
                                ]}>
                                <ThemedText
                                    type="small"
                                    style={{ color: isSelected ? colors.text : colors.textSecondary }}>
                                    {day.label}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Event list */}
                <ScrollView
                    style={styles.eventList}
                    contentContainerStyle={styles.eventListContent}>
                    {currentDay?.events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            colors={colors}
                            isFavorited={favorites.includes(event.id)}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    ))}
                </ScrollView>

            </SafeAreaView>
        </ThemedView>
    );
}

function EventCard({
                       event,
                       colors,
                       isFavorited,
                       onToggleFavorite,
                   }: {
    event: ScheduleEvent;
    colors: typeof Colors.light;
    isFavorited: boolean;
    onToggleFavorite: (eventId: number) => void;
}) {
    const start = new Date(event.start_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
    const end = event.end_time
        ? new Date(event.end_time).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        })
        : null;

    const moderator = event.event_person?.find((ep) => ep.role === 'moderator');
    const speakers = event.event_person?.filter((ep) =>
        ['speaker', 'presenter'].includes(ep.role)
    );

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>

            {/* Header row: time/location + star */}
            <View style={styles.cardHeader}>
                <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1 }}>
                    {start}{end ? ` – ${end}` : ''} · {event.location?.address_name ?? event.location?.location_name}
                </ThemedText>
                <TouchableOpacity
                    onPress={() => onToggleFavorite(event.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <ThemedText style={{ fontSize: 18 }}>
                        {isFavorited ? '⭐' : '☆'}
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <ThemedText type="defaultSemiBold">{event.title}</ThemedText>

            {moderator && (
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    Moderator: {moderator.person.first_name} {moderator.person.last_initial}
                </ThemedText>
            )}
            {speakers && speakers.length > 0 && (
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    {speakers.map((s) => `${s.person.first_name} ${s.person.last_initial}`).join(', ')}
                </ThemedText>
            )}
            {(event.interpretation) && (
                <View style={styles.badges}>
                    {event.interpretation && (
                        <View style={[styles.badge, { backgroundColor: colors.backgroundSelected }]}>
                            <ThemedText type="small">ASL</ThemedText>
                        </View>
                    )}
                    {event.interpretation && (
                        <View style={[styles.badge, { backgroundColor: colors.backgroundSelected }]}>
                            <ThemedText type="small">Español</ThemedText>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    safeArea: {
        flex: 1,
        maxWidth: MaxContentWidth,
        paddingBottom: BottomTabInset,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBar: {
        flexGrow: 0,
        paddingTop: Spacing.three,
    },
    tabBarContent: {
        paddingHorizontal: Spacing.three,
        gap: Spacing.two,
    },
    tab: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Spacing.two,
    },
    eventList: {
        flex: 1,
    },
    eventListContent: {
        padding: Spacing.three,
        gap: Spacing.two,
        paddingBottom: Spacing.five,
    },
    card: {
        borderRadius: Spacing.two,
        padding: Spacing.three,
        gap: Spacing.one,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    badges: {
        flexDirection: 'row',
        gap: Spacing.one,
        marginTop: Spacing.one,
    },
    badge: {
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.half,
        borderRadius: Spacing.one,
    },
});