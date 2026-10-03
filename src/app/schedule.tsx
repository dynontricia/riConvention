import { useEffect, useState, useCallback, useRef } from 'react';
import {
    ActionSheetIOS,
    ActivityIndicator,
    Platform,
    ScrollView,
    SectionList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {Colors, Spacing, BottomTabInset, MaxContentWidth, AppColors} from '@/constants/theme';
import { fetchSchedule, DaySchedule, ScheduleEvent } from '@/utils/queries/schedule';
import { fetchFavorites, addFavorite, removeFavorite } from '@/utils/queries/favorites';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const EVENT_TYPES = [
    'All Types',
    'Speaker Meeting',
    'Marathon Meeting',
    'Al-Anon',
    'Service',
    'Meal',
    'Entertainment',
    'Social',
    'Workshop',
    'Fitness'
];

// ─── FILTER LOGIC ────────────────────────────────────────────────────────────

function applyFilters(
    days: DaySchedule[],
    favoritesOnly: boolean,
    interpretation: boolean,
    selectedType: string,
    favorites: number[]
): DaySchedule[] {
    return days.map((day) => ({
        ...day,
        events: day.events.filter((event) => {
            if (favoritesOnly && !favorites.includes(event.id)) return false;
            if (interpretation && !event.interpretation) return false;
            if (selectedType !== 'All Types' &&
                event.event_type?.toLowerCase() !== selectedType.toLowerCase()) return false;
            return true;
        }),
    })).filter((day) => day.events.length > 0);
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
    const scheme = useColorScheme();
    const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

    const [days, setDays] = useState<DaySchedule[]>([]);
    const [activeDay, setActiveDay] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<number[]>([]);

    // Filter state
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [interpretation, setInterpretation] = useState(false);
    const [selectedType, setSelectedType] = useState('All Types');

    const sectionListRef = useRef<SectionList>(null);

    useEffect(() => {
        Promise.all([fetchSchedule(), fetchFavorites()])
            .then(([scheduleData, favoritesData]) => {
                setDays(scheduleData);
                setFavorites(favoritesData);
                if (scheduleData.length > 0) setActiveDay(scheduleData[0].date);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleToggleFavorite = async (eventId: number) => {
        const isFavorited = favorites.includes(eventId);
        setFavorites((prev) =>
            isFavorited ? prev.filter((id) => id !== eventId) : [...prev, eventId]
        );
        try {
            if (isFavorited) {
                await removeFavorite(eventId);
            } else {
                await addFavorite(eventId);
            }
        } catch {
            setFavorites((prev) =>
                isFavorited ? [...prev, eventId] : prev.filter((id) => id !== eventId)
            );
        }
    };

    const handleTypePress = useCallback(() => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [...EVENT_TYPES, 'Cancel'],
                    cancelButtonIndex: EVENT_TYPES.length,
                    title: 'Filter by Type',
                },
                (index) => {
                    if (index < EVENT_TYPES.length) {
                        setSelectedType(EVENT_TYPES[index]);
                    }
                }
            );
        }
    }, []);

    const handleDayPress = useCallback((date: string) => {
        const filtered = applyFilters(days, favoritesOnly, interpretation, selectedType, favorites);
        const sectionIndex = filtered.findIndex((d) => d.date === date);
        if (sectionIndex >= 0) {
            setActiveDay(date);
            setTimeout(() => {
                sectionListRef.current?.scrollToLocation({
                    sectionIndex,
                    itemIndex: 0,
                    animated: true,
                    viewOffset: 0,
                });
            }, 100);
        }
    }, [days, favoritesOnly, interpretation, selectedType, favorites]);

    const filteredDays = applyFilters(
        days,
        favoritesOnly,
        interpretation,
        selectedType,
        favorites
    );

    const sections = filteredDays.map((day) => ({
        title: day.label,
        date: day.date,
        data: day.events,
    }));

    const activeFilterCount = [
        favoritesOnly,
        interpretation,
        selectedType !== 'All Types',
    ].filter(Boolean).length;

    const totalEvents = filteredDays.reduce((sum, d) => sum + d.events.length, 0);

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

                {/* Day navigator */}
                <View style={[styles.dayNav, { borderBottomColor: colors.backgroundElement }]}>
                    {days.map((day) => {
                        const isActive = day.date === activeDay;
                        const hasEvents = filteredDays.some((d) => d.date === day.date);
                        return (
                            <TouchableOpacity
                                key={day.date}
                                onPress={() => handleDayPress(day.date)}
                                style={[
                                    styles.dayNavItem,
                                    {
                                        borderBottomWidth: isActive ? 3 : 0,
                                        borderBottomColor: colors.teal,
                                        opacity: hasEvents ? 1 : 0.3,
                                    },
                                ]}>
                                <ThemedText
                                    type="small"
                                    style={{
                                        color: isActive ? colors.teal : colors.textSecondary,
                                        fontWeight: isActive ? '700' : '400',
                                    }}>
                                    {day.label.slice(0, 3)}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Filter bar */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterBar}
                    contentContainerStyle={styles.filterBarContent}>
                    <FilterChip
                        label="Favorites"
                        active={favoritesOnly}
                        onPress={() => setFavoritesOnly((v) => !v)}
                        colors={colors}
                    />
                    <FilterChip
                        label="Interpretation"
                        active={interpretation}
                        onPress={() => setInterpretation((v) => !v)}
                        colors={colors}
                    />
                    <TouchableOpacity
                        onPress={handleTypePress}
                        style={[
                            styles.filterChip,
                            {
                                borderWidth: 1,
                                borderColor: selectedType !== 'All Types'
                                    ? colors.teal
                                    : colors.textSecondary,
                                backgroundColor: selectedType !== 'All Types'
                                    ? colors.teal + '22'
                                    : 'transparent',
                            },
                        ]}>
                        <ThemedText
                            type="small"
                            style={{
                                color: selectedType !== 'All Types'
                                    ? colors.teal
                                    : colors.textSecondary,
                            }}>
                            {selectedType === 'All Types' ? 'Type ▾' : `${selectedType} ▾`}
                        </ThemedText>
                    </TouchableOpacity>
                </ScrollView>

                {/* Active filters summary */}
                {activeFilterCount > 0 && (
                    <View style={styles.resultsRow}>
                        <ThemedText type="small" themeColor="textSecondary">
                            {totalEvents} event{totalEvents !== 1 ? 's' : ''} · {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                        </ThemedText>
                        <TouchableOpacity onPress={() => {
                            setFavoritesOnly(false);
                            setInterpretation(false);
                            setSelectedType('All Types');
                        }}>
                            <ThemedText type="small" style={{ color: colors.teal }}>
                                Clear all
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Event list */}
                {sections.length === 0 ? (
                    <ThemedView type="backgroundElement" style={styles.emptyState}>
                        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                            No events match your filters.{'\n'}Try adjusting or clearing them.
                        </ThemedText>
                    </ThemedView>
                ) : (
                    <SectionList
                        ref={sectionListRef}
                        sections={sections}
                        keyExtractor={(item, index) => item?.id?.toString() ?? `item-${index}`}
                        stickySectionHeadersEnabled
                        onViewableItemsChanged={({ viewableItems }) => {
                            const firstSection = viewableItems.find((v) => v.isViewable);
                            if (firstSection?.section?.date) {
                                setActiveDay(firstSection.section.date);
                            }
                        }}
                        onScrollToIndexFailed={() => {
                            setTimeout(() => {
                                sectionListRef.current?.scrollToLocation({
                                    sectionIndex: filteredDays.findIndex((d) => d.date === activeDay),
                                    itemIndex: 0,
                                    animated: true,
                                });
                            }, 500);
                        }}
                        viewabilityConfig={{
                            itemVisiblePercentThreshold: 10,
                        }}
                        renderSectionHeader={({ section }) => (
                            <View style={[
                                styles.sectionHeader,
                                { backgroundColor: colors.background, borderBottomColor: colors.backgroundElement },
                            ]}>
                                <ThemedText type="defaultSemiBold" style={{ color: colors.teal }}>
                                    {section.title}
                                </ThemedText>
                            </View>
                        )}
                        renderItem={({ item }) => {
                            if (!item?.id) return null;
                            return (
                                <EventCard
                                    event={item}
                                    colors={colors}
                                    isFavorited={favorites.includes(item.id)}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            );
                        }}
                        contentContainerStyle={styles.listContent}
                        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
                    />
                )}

            </SafeAreaView>
        </ThemedView>
    );
}

// ─── FILTER CHIP ─────────────────────────────────────────────────────────────

function FilterChip({
                        label,
                        active,
                        onPress,
                        colors,
                    }: {
    label: string;
    active: boolean;
    onPress: () => void;
    colors: AppColors
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.filterChip,
                {
                    borderWidth: 1,
                    borderColor: active ? colors.teal : colors.textSecondary,
                    backgroundColor: active ? colors.teal + '22' : 'transparent',
                },
            ]}>
            <ThemedText
                type="small"
                style={{ color: active ? colors.teal : colors.textSecondary }}>
                {label}
            </ThemedText>
        </TouchableOpacity>
    );
}

// ─── EVENT CARD ──────────────────────────────────────────────────────────────

function EventCard({
                       event,
                       colors,
                       isFavorited,
                       onToggleFavorite,
                   }: {
    event: ScheduleEvent;
    colors: AppColors;
    isFavorited: boolean;
    onToggleFavorite: (eventId: number) => void;
}) {
    const isPast = new Date(event.end_time ?? event.start_time) < new Date();

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
        <View style={[
            styles.card,
            {
                backgroundColor: colors.backgroundElement,
                opacity: isPast ? 0.5 : 1,
            },
        ]}>
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

            {isPast && (
                <ThemedText type="small" style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                    Session ended
                </ThemedText>
            )}

            {(event.interpretation) && (
                <View style={styles.badges}>
                    {event.interpretation && (
                        <View style={[styles.badge, { backgroundColor: colors.backgroundSelected }]}>
                            <ThemedText type="small">Interpretation</ThemedText>
                        </View>
                    )}
                </View>
            )}
        </View>
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
        paddingBottom: BottomTabInset,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayNav: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        marginTop: Spacing.three,
        marginHorizontal: Spacing.three,
    },
    dayNavItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.two,
    },
    filterBar: {
        flexGrow: 0,
        paddingTop: Spacing.two,
        height: 60,
        alignContent: 'center',
    },
    filterBarContent: {
        gap: Spacing.two,
        paddingBottom: Spacing.one,
        marginHorizontal: Spacing.three,
    },
    filterChip: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.one,
        borderRadius: Spacing.five,
        minHeight: 36,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    resultsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.two,
    },
    sectionHeader: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderBottomWidth: 1,
    },
    listContent: {
        padding: Spacing.three,
        paddingBottom: Spacing.six,
    },
    emptyState: {
        margin: Spacing.three,
        padding: Spacing.four,
        borderRadius: Spacing.two,
        alignItems: 'center',
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