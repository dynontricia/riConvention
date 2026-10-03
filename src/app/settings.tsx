import { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import ProfileForm, { ProfileFormValues } from '@/components/onboarding/profile-form';
import { getUserName, saveUserName, clearUserData, getLargeText, setLargeText } from '@/utils/storage';
import { getProfile, saveProfile } from '@/utils/queries/profile';
import { fetchFavorites } from '@/utils/queries/favorites';
import {
    requestNotificationPermission,
    scheduleEventReminders,
    cancelAllReminders,
    getScheduledReminderCount,
} from '@/utils/notifications';
import { useTextSize } from '@/context/TextSizeContext';
import { deleteProfile } from '@/utils/queries/profile';

export default function SettingsScreen() {
    const safeAreaInsets = useSafeAreaInsets();
    const insets = {
        ...safeAreaInsets,
        bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    };
    const theme = useTheme();
    const scheme = useColorScheme();
    const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [initialValues, setInitialValues] = useState<Partial<ProfileFormValues>>({});
    const { largeText, toggleLargeText } = useTextSize();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [reminderCount, setReminderCount] = useState(0);

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

    useEffect(() => {
        async function load() {
            const count = await getScheduledReminderCount();
            setNotificationsEnabled(count > 0);
            setReminderCount(count);
        }
        load();
    }, []);

    const handleLargeTextToggle = async (value: boolean) => {
        await toggleLargeText(value);
    };

    const handleNotificationsToggle = async (value: boolean) => {
        if (value) {
            const { status: existing } = await Notifications.getPermissionsAsync();

            if (existing === 'denied') {
                // Can't ask again — send them to Settings
                Alert.alert(
                    'Notifications Blocked',
                    'To enable reminders, go to Settings → RIConvention → Notifications and turn them on.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open Settings',
                            onPress: () => Linking.openURL('app-settings:'),
                        },
                    ]
                );
                return;
            }

            const granted = await requestNotificationPermission();
            if (!granted) return;

            const favorites = await fetchFavorites();
            await scheduleEventReminders(favorites);
            const count = await getScheduledReminderCount();
            setReminderCount(count);
            setNotificationsEnabled(true);
        } else {
            await cancelAllReminders();
            setReminderCount(0);
            setNotificationsEnabled(false);
        }
    };

    const loadProfile = useCallback(async () => {
        const [name, profile] = await Promise.all([getUserName(), getProfile()]);
        setInitialValues({
            firstName: name.firstName,
            lastInitial: name.lastInitial,
            homeGroup: profile?.home_group ?? '',
            servicePositions: profile?.current_service_position ?? [],
            interests: profile?.interests ?? [],
            isConventionCommittee: profile?.conv_comm_init ?? false,
        });
    }, []);

    const handleOpenProfile = async () => {
        await loadProfile();
        setShowProfileModal(true);
    };

    const handleSaveProfile = async (values: ProfileFormValues) => {
        await saveUserName(values.firstName, values.lastInitial);
        await saveProfile(values.homeGroup, values.servicePositions, values.interests, values.isConventionCommittee);
        setShowProfileModal(false);
    };

    const handleResetProfile = async () => {
        await clearUserData();
        await deleteProfile();
        setInitialValues({});
    };

    return (
        <>
            <ScrollView
                style={[styles.scrollView, { backgroundColor: theme.background }]}
                contentInset={insets}
                contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
                <ThemedView style={styles.container}>

                    {/* Header */}
                    <ThemedView style={styles.titleContainer}>
                        <ThemedText type="subtitle">Settings</ThemedText>
                        <ThemedText style={styles.centerText} themeColor="textSecondary">
                            Customize your convention experience.
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.sectionsWrapper}>

                        {/* My Profile */}
                        <Collapsible title="My Profile">
                            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                                Your name stays on this device only. Area and service role help personalize your experience.
                            </ThemedText>
                            <TouchableOpacity
                                onPress={handleOpenProfile}
                                style={[styles.actionButton, { backgroundColor: colors.backgroundElement }]}>
                                <ThemedText type="small" style={{ fontWeight: '600' }}>Edit My Profile</ThemedText>
                                <ThemedText type="small" style={{ color: colors.textSecondary }}>›</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleResetProfile}
                                style={[styles.actionButton, {
                                    backgroundColor: colors.backgroundElement,
                                    marginTop: Spacing.two,
                                }]}>
                                <ThemedText type="small" style={{ color: 'tomato' }}>Reset Profile</ThemedText>
                                <ThemedText type="small" style={{ color: colors.textSecondary }}>›</ThemedText>
                            </TouchableOpacity>
                        </Collapsible>

                        {/* Notifications */}
                        <Collapsible title="Notifications">
                            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                                Get a reminder 15 minutes before each of your starred sessions.
                            </ThemedText>
                            <View style={[styles.settingRow, { backgroundColor: colors.backgroundElement }]}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText type="small" style={{ fontWeight: '600' }}>
                                        Session Reminders
                                    </ThemedText>
                                    {notificationsEnabled && reminderCount > 0 && (
                                        <ThemedText type="small" themeColor="textSecondary">
                                            {reminderCount} reminder{reminderCount !== 1 ? 's' : ''} scheduled
                                        </ThemedText>
                                    )}
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={handleNotificationsToggle}
                                    trackColor={{
                                        false: colors.backgroundSelected,
                                        true: colors.teal,
                                    }}
                                    thumbColor="#ffffff"
                                />
                            </View>
                            {notificationsEnabled && (
                                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                                    ⭐ Star sessions on the Schedule tab to add reminders.
                                </ThemedText>
                            )}
                        </Collapsible>

                        {/* Accessibility */}
                        <Collapsible title="Accessibility">
                            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                                Adjust the app for your needs.
                            </ThemedText>
                            <View style={[styles.settingRow, { backgroundColor: colors.backgroundElement }]}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText type="small" style={{ fontWeight: '600' }}>Large Text</ThemedText>
                                    <ThemedText type="small" themeColor="textSecondary">
                                        Increases text size throughout the app
                                    </ThemedText>
                                </View>
                                <Switch
                                    value={largeText}
                                    onValueChange={handleLargeTextToggle}
                                    trackColor={{
                                        false: colors.backgroundSelected,
                                        true: colors.teal,
                                    }}
                                    thumbColor="#ffffff"
                                />
                            </View>
                            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                                💡 You can also use your device's built-in accessibility settings for screen reading and additional text size options.
                            </ThemedText>
                        </Collapsible>

                        {/* App Info */}
                        <Collapsible title="About">
                            <View style={{ gap: Spacing.two }}>
                                <View style={[styles.infoRow, { backgroundColor: colors.backgroundElement }]}>
                                    <ThemedText type="small" themeColor="textSecondary">Event</ThemedText>
                                    <ThemedText type="small" style={{ fontWeight: '600' }}>2027 R.I. State Convention</ThemedText>
                                </View>
                                <View style={[styles.infoRow, { backgroundColor: colors.backgroundElement }]}>
                                    <ThemedText type="small" themeColor="textSecondary">Location</ThemedText>
                                    <ThemedText type="small" style={{ fontWeight: '600' }}>Newport, RI</ThemedText>
                                </View>
                                <View style={[styles.infoRow, { backgroundColor: colors.backgroundElement }]}>
                                    <ThemedText type="small" themeColor="textSecondary">Dates</ThemedText>
                                    <ThemedText type="small" style={{ fontWeight: '600' }}>Feb 5–7, 2027</ThemedText>
                                </View>
                                <View style={[styles.infoRow, { backgroundColor: colors.backgroundElement }]}>
                                    <ThemedText type="small" themeColor="textSecondary">Host</ThemedText>
                                    <ThemedText type="small" style={{ fontWeight: '600' }}>Area 61 Rhode Island</ThemedText>
                                </View>
                                <View style={[styles.infoRow, { backgroundColor: colors.backgroundElement }]}>
                                    <ThemedText type="small" themeColor="textSecondary">App Version</ThemedText>
                                    <ThemedText type="small" style={{ fontWeight: '600' }}>1.0.0</ThemedText>
                                </View>
                            </View>
                        </Collapsible>

                    </ThemedView>
                </ThemedView>
            </ScrollView>

            {/* Profile edit modal */}
            <Modal
                visible={showProfileModal}
                animationType="slide"
                presentationStyle="pageSheet">
                <ThemedView style={styles.modalContainer}>
                    <SafeAreaView style={styles.modalSafeArea}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundElement }]}>
                            <ThemedText type="defaultSemiBold">Edit My Profile</ThemedText>
                            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                                <ThemedText type="small" style={{ color: colors.textSecondary }}>Cancel</ThemedText>
                            </TouchableOpacity>
                        </View>
                        <ProfileForm
                            initialValues={initialValues}
                            onSave={handleSaveProfile}
                            showSkip={false}
                        />
                    </SafeAreaView>
                </ThemedView>
            </Modal>
        </>
    );
}

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
        paddingTop: Spacing.three,
        paddingBottom: Spacing.four,
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.three,
        borderRadius: Spacing.two,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.three,
        borderRadius: Spacing.two,
        gap: Spacing.two,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.three,
        borderRadius: Spacing.two,
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
});