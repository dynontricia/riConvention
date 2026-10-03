import { useState, useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
    Image,
    Linking,
    Modal,
    Platform,
    Dimensions,
    useWindowDimensions,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { submitAskItBasket, submitFeedback } from '@/utils/queries/submissions';

// ─── DATA ────────────────────────────────────────────────────────────────────

const RESTAURANTS = [
    {
        name: 'Track 15',
        type: 'Food Hall',
        distance: '5 min walk',
        note: 'Providence\'s first food hall in the historic Union Station. Multiple vendors — seafood, Mexican, Italian, burgers, craft beer.',
        address: '1 Exchange Terrace, Providence',
    },
    {
        name: 'Hemenway\'s',
        type: 'Seafood',
        distance: '4 min walk',
        note: 'Classic Providence seafood institution. Rhode Island oysters, lobster, great for groups.',
        address: '1 Providence Washington Plaza',
    },
    {
        name: 'Trinity Brewhouse',
        type: 'American / Pub',
        distance: '3 min walk',
        note: 'Local craft brewery with pub food. Casual, loud, great beer. Perfect for after-session decompression.',
        address: '186 Fountain St, Providence',
    },
    {
        name: 'Murphy\'s Providence',
        type: 'Irish Pub',
        distance: '4 min walk',
        note: 'Classic Irish pub, open late. Comfort food, good atmosphere, very walkable from the RICC.',
        address: '100 Fountain St, Providence',
    },
    {
        name: 'Fleur Providence',
        type: 'French / Mediterranean',
        distance: 'In the Omni',
        note: 'Located right in the Omni Hotel. Parisian-inspired cuisine, elegant atmosphere. Great for a nicer dinner.',
        address: '1 West Exchange St (Omni Providence)',
    },
    {
        name: 'Café Nuovo',
        type: 'Global / Waterfront',
        distance: '8 min walk',
        note: 'Elegant waterfront dining with big wine list. Global menu, beautiful views of the Providence River.',
        address: '1 Citizens Plaza, Providence',
    },
    {
        name: 'Fogo de Chão',
        type: 'Brazilian Steakhouse',
        distance: '5 min walk',
        note: 'All-you-can-eat Brazilian churrasco. Great for groups and big appetites.',
        address: '148 Providence Place, Suite 2060',
    },
];

const COFFEE = [
    {
        name: 'Seven Stars Bakery',
        type: 'Bakery / Coffee',
        distance: '10 min walk',
        note: 'Providence institution. Exceptional bread, pastries, and coffee. Worth the walk.',
        address: '342 Broadway, Providence',
    },
    {
        name: 'Dave\'s Coffee',
        type: 'Coffee',
        distance: '8 min walk',
        note: 'Famous for Rhode Island coffee milk. Local roaster, great lattes.',
        address: 'Downtown Providence location',
    },
    {
        name: 'Bolt Coffee (Dean Hotel)',
        type: 'Specialty Coffee',
        distance: '10 min walk',
        note: 'Specialty coffee in the lobby of the Dean Hotel. Serious coffee, great vibe.',
        address: '122 Fountain St, Providence',
    },
    {
        name: 'New Harvest Coffee',
        type: 'Specialty Coffee / Roaster',
        distance: '12 min walk',
        note: 'Providence\'s best specialty roaster. If you\'re serious about coffee, this is your spot. ☕',
        address: 'Downtown Providence',
    },
];

const MAPS = [
    {
        venue: 'Newport Marriott',
        floors: [
            { label: '3rd Floor', image: require('@/assets/images/3rdFloor.png') },
            { label: '2nd Floor', image: require('@/assets/images/2ndFloor.png') },
        ],
    },
    {
        venue: 'Newport Area',
        floors: [
            { label: 'Area Map', image: require('@/assets/images/newportMap.png') },
        ],
    },
];

// ─── STAR RATING ─────────────────────────────────────────────────────────────

function StarRating({
                        value,
                        onChange,
                        colors,
                    }: {
    value: number | null;
    onChange: (v: number) => void;
    colors: typeof Colors.light;
}) {
    return (
        <View style={{
            flexDirection: 'row',
            gap: Spacing.two,
            minHeight: 50,
            alignItems: 'center'
        }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => onChange(star)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <ThemedText style={{ fontSize: 24 }}>
                        {value && value >= star ? '⭐' : '☆'}
                    </ThemedText>
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── FEEDBACK MODAL ───────────────────────────────────────────────────────────

function FeedbackModal({
                           visible,
                           onClose,
                           colors,
                       }: {
    visible: boolean;
    onClose: () => void;
    colors: typeof Colors.light;
}) {
    const [overallRating, setOverallRating] = useState<number | null>(null);
    const [panelsRating, setPanelsRating] = useState<number | null>(null);
    const [roundtablesRating, setRoundtablesRating] = useState<number | null>(null);
    const [venueRating, setVenueRating] = useState<number | null>(null);
    const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
    const [whatWorked, setWhatWorked] = useState('');
    const [whatImprove, setWhatImprove] = useState('');
    const [futureTopics, setFutureTopics] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await submitFeedback({
                overall_rating: overallRating,
                panels_rating: panelsRating,
                roundtables_rating: roundtablesRating,
                venue_rating: venueRating,
                would_return: wouldReturn,
                what_worked: whatWorked,
                what_improve: whatImprove,
                future_topics: futureTopics,
            });
            setSubmitted(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSubmitted(false);
        setOverallRating(null);
        setPanelsRating(null);
        setRoundtablesRating(null);
        setVenueRating(null);
        setWouldReturn(null);
        setWhatWorked('');
        setWhatImprove('');
        setFutureTopics('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <ThemedView style={styles.modalContainer}>
                <SafeAreaView style={styles.modalSafeArea}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundElement }]}>
                        <ThemedText type="defaultSemiBold">Share Feedback</ThemedText>
                        <TouchableOpacity onPress={handleClose}>
                            <ThemedText type="small" style={{ color: colors.textSecondary }}>Close</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {submitted ? (
                            <View style={styles.successContainer}>
                                <ThemedText style={styles.successEmoji}>🙏</ThemedText>
                                <ThemedText type="defaultSemiBold" style={{ textAlign: 'center' }}>
                                    Thank you for your feedback!
                                </ThemedText>
                                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                                    Your responses help make future conventions even better.
                                </ThemedText>
                            </View>
                        ) : (
                            <>
                                <View style={[styles.disclaimer, { backgroundColor: colors.backgroundElement }]}>
                                    <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                                        🔒 All feedback is completely anonymous.
                                    </ThemedText>
                                </View>

                                <RatingRow label="Overall Experience" value={overallRating} onChange={setOverallRating} colors={colors} />
                                <RatingRow label="Panels" value={panelsRating} onChange={setPanelsRating} colors={colors} />
                                <RatingRow label="Roundtables" value={roundtablesRating} onChange={setRoundtablesRating} colors={colors} />
                                <RatingRow label="Venue & Logistics" value={venueRating} onChange={setVenueRating} colors={colors} />

                                {/* Would return */}
                                <View style={styles.formField}>
                                    <ThemedText type="small" style={styles.fieldLabel}>Would you attend the R.I. Convention again?</ThemedText>
                                    <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                                        {[true, false].map((val) => (
                                            <TouchableOpacity
                                                key={String(val)}
                                                onPress={() => setWouldReturn(val)}
                                                style={[styles.yesNoButton, {
                                                    backgroundColor: wouldReturn === val ? colors.text : colors.backgroundElement,
                                                }]}>
                                                <ThemedText style={{
                                                    color: wouldReturn === val ? colors.background : colors.text,
                                                    fontWeight: '600',
                                                }}>
                                                    {val ? 'Yes' : 'No'}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.formField}>
                                    <ThemedText type="small" style={styles.fieldLabel}>What worked well?</ThemedText>
                                    <TextInput
                                        value={whatWorked}
                                        onChangeText={setWhatWorked}
                                        placeholder="Share what you enjoyed..."
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        numberOfLines={3}
                                        style={[styles.textArea, { backgroundColor: colors.backgroundElement, color: colors.text }]}
                                    />
                                </View>

                                <View style={styles.formField}>
                                    <ThemedText type="small" style={styles.fieldLabel}>What could be improved?</ThemedText>
                                    <TextInput
                                        value={whatImprove}
                                        onChangeText={setWhatImprove}
                                        placeholder="Share your suggestions..."
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        numberOfLines={3}
                                        style={[styles.textArea, { backgroundColor: colors.backgroundElement, color: colors.text }]}
                                    />
                                </View>

                                <View style={styles.formField}>
                                    <ThemedText type="small" style={styles.fieldLabel}>Suggestions for future conventions?</ThemedText>
                                    <TextInput
                                        value={futureTopics}
                                        onChangeText={setFutureTopics}
                                        placeholder="What would you like to see..."
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        numberOfLines={3}
                                        style={[styles.textArea, { backgroundColor: colors.backgroundElement, color: colors.text }]}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                    style={[styles.submitButton, { backgroundColor: colors.text }]}>
                                    <ThemedText style={{ color: colors.background, fontWeight: '600' }}>
                                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                                    </ThemedText>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </ThemedView>
        </Modal>
    );
}

function RatingRow({
                       label,
                       value,
                       onChange,
                       colors,
                   }: {
    label: string;
    value: number | null;
    onChange: (v: number) => void;
    colors: typeof Colors.light;
}) {
    return (
        <View style={styles.formField}>
            <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
            <StarRating value={value} onChange={onChange} colors={colors} />
        </View>
    );
}

// ─── PLACE CARD ──────────────────────────────────────────────────────────────

function PlaceCard({
                       name,
                       type,
                       distance,
                       note,
                       address,
                       colors,
                   }: {
    name: string;
    type: string;
    distance: string;
    note: string;
    address: string;
    colors: typeof Colors.light;
}) {
    const handleDirections = () => {
        const url = Platform.select({
            ios: `maps:?q=${encodeURIComponent(address)}`,
            android: `geo:0,0?q=${encodeURIComponent(address)}`,
        });
        if (url) Linking.openURL(url);
    };

    return (
        <View style={[styles.placeCard, { backgroundColor: colors.backgroundElement }]}>
            <View style={styles.placeCardHeader}>
                <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold">{name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{type} · {distance}</ThemedText>
                </View>
                <TouchableOpacity onPress={handleDirections}>
                    <ThemedText style={{ fontSize: 20 }}>🗺️</ThemedText>
                </TouchableOpacity>
            </View>
            <ThemedText type="small">{note}</ThemedText>
        </View>
    );
}

// ─── MAP MODAL ───────────────────────────────────────────────────────────────

function MapModal({
                      visible,
                      title,
                      image,
                      onClose,
                      colors,
                  }: {
    visible: boolean;
    title: string;
    image: number;
    onClose: () => void;
    colors: typeof Colors.light;
}) {
    const { width, height } = useWindowDimensions();

    console.log('dimensions:', width, height);
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            animationType="fade"
            presentationStyle="pageSheet"
            onRequestClose={onClose}>
            <ThemedView style={styles.mapModalContainer}>

                {/* Header — manually respects safe area insets */}
                <View style={[
                    styles.mapModalHeader,
                    {
                        paddingTop: insets.top - Spacing.three,
                        paddingLeft: insets.left + Spacing.four,
                        paddingRight: insets.right + Spacing.four,
                        borderBottomColor: colors.backgroundElement,
                        backgroundColor: colors.background,
                    }
                ]}>
                    <ThemedText
                        type="defaultSemiBold"
                        numberOfLines={1}
                        style={{ flex: 1 }}>
                        {title}
                    </ThemedText>
                    <TouchableOpacity
                        onPress={onClose}
                        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                        style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
                        <ThemedText type="small" style={{ fontWeight: '600' }}>✕ Close</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Zoomable map */}
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.mapScrollContent}
                    maximumZoomScale={4}
                    minimumZoomScale={1}
                    bouncesZoom
                    centerContent
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}>
                    <Image
                        source={image}
                        style={{ width, height: height * 0.85 }}
                        resizeMode="contain"
                    />
                </ScrollView>

                {/* Hint — respects bottom inset */}
                <View style={[
                    styles.mapHint,
                    {
                        backgroundColor: colors.backgroundElement,
                        marginBottom: insets.bottom - Spacing.five - Spacing.two,
                        marginLeft: insets.left + Spacing.three,
                        marginRight: insets.right + Spacing.three,
                    }
                ]}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                        Pinch to zoom · Rotate device for landscape view
                    </ThemedText>
                </View>

            </ThemedView>
        </Modal>
    );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function EventGuideScreen() {
    const safeAreaInsets = useSafeAreaInsets();
    const insets = {
        ...safeAreaInsets,
        bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    };
    const theme = useTheme();
    const scheme = useColorScheme();
    const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

    const [showFeedback, setShowFeedback] = useState(false);
    const [activeMap, setActiveMap] = useState<{
        title: string;
        image: number;
    } | null>(null);

    const contentPlatformStyle = Platform.select({
        android: {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom,
        },
        web: {
            paddingTop: Spacing.six,
            paddingBottom: Spacing.four,
        },
    });

    // @ts-ignore
    return (
        <>
            <ScrollView
                style={[styles.scrollView, { backgroundColor: theme.background }]}
                contentInset={insets}
                contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
                <ThemedView style={styles.container}>

                    {/* Header */}
                    <ThemedView style={styles.titleContainer}>
                        <ThemedText type="subtitle">Event Guide</ThemedText>
                        <ThemedText style={styles.centerText} themeColor="textSecondary">
                            Everything you need for the 2027 R.I. State Convention in Newport, RI.
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.sectionsWrapper}>

                        {/* Your Voice */}
                        <Collapsible title="Your Voice">
                            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
                                Want to share your experience? Forms are completely anonymous.
                            </ThemedText>
                            <View style={{ gap: Spacing.two }}>
                                <TouchableOpacity
                                    onPress={() => setShowFeedback(true)}
                                    style={[styles.voiceButton, { backgroundColor: colors.backgroundElement }]}>
                                    <View>
                                        <ThemedText type="defaultSemiBold">📝 Share Feedback</ThemedText>
                                        <ThemedText type="small" themeColor="textSecondary">
                                            Rate your convention experience
                                        </ThemedText>
                                    </View>
                                    <ThemedText style={{ color: colors.textSecondary }}>›</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </Collapsible>

                        {/* Venue Maps */}
                        <Collapsible title="Venue Maps">
                            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                                Tap any map to open full screen. Pinch to zoom, rotate for landscape.
                            </ThemedText>
                            <View style={{ gap: Spacing.three }}>
                                {MAPS.map((venue) => (
                                    <View key={venue.venue}>
                                        <ThemedText type="defaultSemiBold" style={{ marginBottom: Spacing.two }}>
                                            {venue.venue}
                                        </ThemedText>
                                        <View style={{ gap: Spacing.two }}>
                                            {venue.floors.map((floor) => (
                                                <TouchableOpacity
                                                    key={floor.label}
                                                    onPress={() => setActiveMap({ title: `${venue.venue} — ${floor.label}`, image: floor.image })}
                                                    style={[styles.mapThumbnailContainer, { backgroundColor: colors.backgroundElement }]}>
                                                    <Image
                                                        source={floor.image}
                                                        style={styles.mapThumbnail}
                                                        resizeMode="cover"
                                                    />
                                                    <View style={styles.mapThumbnailLabel}>
                                                        <ThemedText type="small" style={{ fontWeight: '600' }}>{floor.label}</ThemedText>
                                                        <ThemedText type="small" themeColor="textSecondary">Tap to expand →</ThemedText>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </Collapsible>

                        {/* Restaurants */}
                        <Collapsible title="Restaurants Nearby">
                            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                                All within walking distance of the Newport Marriott. Tap 🗺️ for directions.
                            </ThemedText>
                            <View style={{ gap: Spacing.two }}>
                                {RESTAURANTS.map((r) => (
                                    <PlaceCard key={r.name} {...r} colors={colors} />
                                ))}
                            </View>
                        </Collapsible>

                        {/* Coffee */}
                        <Collapsible title="Coffee ☕">
                            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                                Fuel for the fellowship. Tap 🗺️ for directions.
                            </ThemedText>
                            <View style={{ gap: Spacing.two }}>
                                {COFFEE.map((c) => (
                                    <PlaceCard key={c.name} {...c} colors={colors} />
                                ))}
                            </View>
                        </Collapsible>

                    </ThemedView>
                </ThemedView>
            </ScrollView>
            <FeedbackModal
                visible={showFeedback}
                onClose={() => setShowFeedback(false)}
                colors={colors}
            />
            {(
                <MapModal
                    visible={!!activeMap}
                    title={activeMap?.title ?? ''}
                    image={activeMap?.image ?? 0}
                    onClose={() => setActiveMap(null)}
                    colors={colors}
                />
            )}
        </>
    );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    scrollView: { flex: 1 },
    contentContainer: { flexDirection: 'row', justifyContent: 'center' },
    container: { maxWidth: MaxContentWidth, flexGrow: 1 },
    titleContainer: {
        gap: Spacing.two,
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        paddingBottom: Spacing.two,
    },
    centerText: { textAlign: 'center' },
    sectionsWrapper: {
        gap: Spacing.three,
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.four,
    },
    voiceButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.three,
        borderRadius: Spacing.two,
    },
    mapPlaceholder: {
        padding: Spacing.four,
        borderRadius: Spacing.two,
        alignItems: 'center',
        gap: Spacing.two,
    },
    placeCard: {
        borderRadius: Spacing.two,
        padding: Spacing.three,
        gap: Spacing.one,
    },
    placeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    modalContainer: { flex: 1 },
    modalSafeArea: { flex: 1 },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.four,
        borderBottomWidth: 1,
    },
    modalContent: {
        padding: Spacing.four,
        gap: Spacing.three,
    },
    disclaimer: {
        padding: Spacing.three,
        borderRadius: Spacing.two,
    },
    textArea: {
        borderRadius: Spacing.two,
        padding: Spacing.three,
        fontSize: 16,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    submitButton: {
        borderRadius: Spacing.two,
        padding: Spacing.three,
        alignItems: 'center',
    },
    successContainer: {
        alignItems: 'center',
        gap: Spacing.three,
        paddingTop: Spacing.six,
    },
    successEmoji: { fontSize: 48 },
    formField: { gap: Spacing.two },
    fieldLabel: { fontWeight: '600' },
    yesNoButton: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.two,
        borderRadius: Spacing.two,
        minWidth: 80,
        alignItems: 'center',
    },
    map: {
        overflow: 'hidden',
        width: 300,
        height: "auto",
        padding: Spacing.four,
        borderRadius: Spacing.two,
        alignItems: 'center',
        gap: Spacing.two
    },
    mapModalContainer: { flex: 1 },
    mapModalSafeArea: { flex: 1 },
    mapModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.two,
        borderBottomWidth: 1,
    },
    mapScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapThumbnailContainer: {
        borderRadius: Spacing.two,
        overflow: 'hidden',
    },
    mapThumbnail: {
        width: '100%',
        height: 160,
    },
    mapThumbnailLabel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.two,
        paddingHorizontal: Spacing.three,
    },
    mapHint: {
        padding: Spacing.two,
        marginTop: Spacing.three,
        borderRadius: Spacing.two,
    },
    closeButton: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Spacing.two,
    },
});