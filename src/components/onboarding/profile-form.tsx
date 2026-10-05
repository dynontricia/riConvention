import { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import CommitteeVerify from '@/components/onboarding/committee-verify';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';

// ─── DATA ────────────────────────────────────────────────────────────────────

export const SERVICE_POSITIONS = [
    {
        group: 'Delegates & Trustees',
        items: ['Delegate', 'Alternate Delegate', 'Past Delegate', 'Trustee'],
    },
    {
        group: 'Area Officers',
        items: ['Area Chair', 'Alternate Chair', 'Area Secretary', 'Area Treasurer / Finance', 'Area Registrar'],
    },
    {
        group: 'District',
        items: ['DCM', 'Alternate DCM', 'DCMC', 'Alternate DCMC'],
    },
    {
        group: 'Group',
        items: ['GSR', 'Alternate GSR'],
    },
    {
        group: 'Committee / Service Roles',
        items: ['Archives', 'Corrections', 'CPC', 'Grapevine / La Viña', 'Intergroup / Central Office Rep', 'Literature', 'Newsletter', 'Public Information', 'Treatment', 'Website / Technology', 'Young People'],
    },
    {
        group: 'Other',
        items: ['Interested Member', 'Al-Anon', 'Committee Member', 'Nunya'],
    },
];

export const INTERESTS = [
    'Accessibilities',
    'Archives',
    'Corrections',
    'CPC (Cooperation with Professionals)',
    'Finance',
    'Grapevine / La Viña',
    'Intergroup / Central Office',
    'Literature',
    'Newsletter',
    'Public Information',
    'Technology / Website',
    'Treatment',
    'Young People',
];

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type ProfileFormValues = {
    firstName: string;
    lastInitial: string;
    homeGroup: string;
    servicePositions: string[];
    interests: string[];
    isConventionCommittee: boolean;
};

type Props = {
    initialValues?: Partial<ProfileFormValues>;
    onSave: (values: ProfileFormValues) => Promise<void>;
    onSkip?: () => void;
    showSkip?: boolean;
};

// ─── MULTI-SELECT PICKER ─────────────────────────────────────────────────────

function MultiSelectPicker({
                               title,
                               groups,
                               flatItems,
                               selected,
                               onChange,
                               colors,
                           }: {
    title: string;
    groups?: { group: string; items: string[] }[];
    flatItems?: string[];
    selected: string[];
    onChange: (values: string[]) => void;
    colors: typeof Colors.light;
}) {
    const [visible, setVisible] = useState(false);

    const toggle = (item: string) => {
        if (selected.includes(item)) {
            onChange(selected.filter((s) => s !== item));
        } else {
            onChange([...selected, item]);
        }
    };

    const displayText = selected.length === 0
        ? `Select ${title}`
        : selected.length === 1
            ? selected[0]
            : `${selected.length} selected`;

    return (
        <>
            {/* Trigger button */}
            <TouchableOpacity
                onPress={() => setVisible(true)}
                style={[styles.pickerTrigger, { backgroundColor: colors.backgroundElement }]}>
                <ThemedText type="small" style={{ color: selected.length === 0 ? colors.textSecondary : colors.text }}>
                    {displayText}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>▾</ThemedText>
            </TouchableOpacity>

            {/* Modal picker */}
            <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
                <ThemedView style={styles.pickerModal}>
                    {/* Header */}
                    <View style={[styles.pickerHeader, { borderBottomColor: colors.backgroundElement }]}>
                        <ThemedText type="defaultSemiBold">{title}</ThemedText>
                        <TouchableOpacity onPress={() => setVisible(false)}>
                            <ThemedText type="small" style={{ color: colors.textSecondary }}>Done</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.pickerContent}>
                        {/* Grouped items */}
                        {groups && groups.map((group) => (
                            <View key={group.group}>
                                <ThemedText
                                    type="small"
                                    style={[styles.groupHeader, { color: colors.textSecondary, borderBottomColor: colors.backgroundElement }]}>
                                    {group.group.toUpperCase()}
                                </ThemedText>
                                {group.items.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        onPress={() => toggle(item)}
                                        style={[styles.pickerRow, { borderBottomColor: colors.backgroundElement }]}>
                                        <ThemedText type="small" style={{ flex: 1 }}>{item}</ThemedText>
                                        <ThemedText style={{ color: colors.textSecondary }}>
                                            {selected.includes(item) ? '✓' : ''}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}

                        {/* Flat items (for interests) */}
                        {flatItems && flatItems.map((item) => (
                            <TouchableOpacity
                                key={item}
                                onPress={() => toggle(item)}
                                style={[styles.pickerRow, { borderBottomColor: colors.backgroundElement }]}>
                                <ThemedText type="small" style={{ flex: 1 }}>{item}</ThemedText>
                                <ThemedText style={{ color: colors.textSecondary }}>
                                    {selected.includes(item) ? '✓' : ''}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </ThemedView>
            </Modal>
        </>
    );
}

// ─── MAIN FORM ───────────────────────────────────────────────────────────────

export default function ProfileForm({ initialValues, onSave, onSkip, showSkip = true }: Props) {
    const scheme = useColorScheme();
    const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

    const [firstName, setFirstName] = useState(initialValues?.firstName ?? '');
    const [lastInitial, setLastInitial] = useState(initialValues?.lastInitial ?? '');
    const [homeGroup, setHomeGroup] = useState(initialValues?.homeGroup ?? '');
    const [servicePositions, setServicePositions] = useState<string[]>(initialValues?.servicePositions ?? []);
    const [interests, setInterests] = useState<string[]>(initialValues?.interests ?? []);
    const [isConventionCommittee, setIsConventionCommittee] = useState(initialValues?.isConventionCommittee ?? false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({ firstName, lastInitial, homeGroup, servicePositions, interests, isConventionCommittee });
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.form}>

            {/* Privacy disclaimer */}
            <ThemedView
                type="backgroundElement"
                style={styles.disclaimer}>
                <ThemedText type="small" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                    🔒 Your name is stored only on YOUR device and is never shared.
                </ThemedText>
            </ThemedView>

            {/* Name row */}
            <View style={styles.row}>
                <View style={styles.fieldHalf}>
                    <ThemedText type="small" style={styles.label}>First Name</ThemedText>
                    <TextInput
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First name"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, {
                            backgroundColor: colors.backgroundElement,
                            color: colors.text,
                        }]}
                    />
                </View>
                <View style={styles.fieldQuarter}>
                    <ThemedText type="small" style={styles.label}>Last Initial</ThemedText>
                    <TextInput
                        value={lastInitial}
                        onChangeText={(t) => setLastInitial(t.slice(0, 1).toUpperCase())}
                        placeholder="B."
                        placeholderTextColor={colors.textSecondary}
                        maxLength={1}
                        autoCapitalize="characters"
                        style={[styles.input, {
                            backgroundColor: colors.backgroundElement,
                            color: colors.text,
                            textAlign: 'center',
                        }]}
                    />
                </View>
            </View>

            {/* Home Group */}
            <View style={styles.field}>
                <ThemedText type="small" style={styles.label}>Home Group</ThemedText>
                <TextInput
                    value={homeGroup}
                    onChangeText={setHomeGroup}
                    placeholder="e.g. Age Doesn't Matter"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, {
                        backgroundColor: colors.backgroundElement,
                        color: colors.text,
                    }]}
                />
            </View>

            {/* Service position */}
            <View style={styles.field}>
                <ThemedText type="small" style={styles.label}>Current Service Position(s)</ThemedText>
                <MultiSelectPicker
                    title="Service Positions"
                    groups={SERVICE_POSITIONS}
                    selected={servicePositions}
                    onChange={setServicePositions}
                    colors={colors}
                />
            </View>

            {/* Interests */}
            <View style={styles.field}>
                <ThemedText type="small" style={styles.label}>Areas of Interest</ThemedText>
                <MultiSelectPicker
                    title="Interests"
                    flatItems={INTERESTS}
                    selected={interests}
                    onChange={setInterests}
                    colors={colors}
                />
            </View>

            {/* Convention Committee */}
            <TouchableOpacity
                onPress={() => setIsConventionCommittee(!isConventionCommittee)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isConventionCommittee }}
                style={styles.checkboxRow}>
                <View style={[styles.checkbox, {
                    borderColor: colors.teal,
                    backgroundColor: isConventionCommittee ? colors.teal : 'transparent',
                }]}>
                    {isConventionCommittee && (
                        <ThemedText type="small" style={{ color: colors.background, fontWeight: '700' }}>✓</ThemedText>
                    )}
                </View>
                <ThemedText type="small" style={styles.label}>I am a Convention Committee Member</ThemedText>
            </TouchableOpacity>

            {isConventionCommittee && <CommitteeVerify />}

            {/* Buttons */}
            <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={[styles.saveButton, { backgroundColor: colors.text }]}>
                <ThemedText style={{ color: colors.background, fontWeight: '600' }}>
                    {saving ? 'Saving...' : 'Save'}
                </ThemedText>
            </TouchableOpacity>

            {showSkip && onSkip && (
                <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
                    <ThemedText type="small" style={{ color: colors.teal }}>
                        Skip for now
                    </ThemedText>
                </TouchableOpacity>
            )}

        </ScrollView>
    );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    form: {
        padding: Spacing.four,
        gap: Spacing.three,
    },
    disclaimer: {
        padding: Spacing.three,
        borderRadius: Spacing.two,
        marginBottom: Spacing.one,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    field: {
        gap: Spacing.one,
    },
    fieldHalf: {
        flex: 2,
        gap: Spacing.one,
    },
    fieldQuarter: {
        flex: 1,
        gap: Spacing.one,
    },
    label: {
        fontWeight: '600',
    },
    input: {
        borderRadius: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        fontSize: 16,
    },
    pickerTrigger: {
        borderRadius: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerModal: {
        flex: 1,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.four,
        borderBottomWidth: 1,
    },
    pickerContent: {
        paddingBottom: Spacing.six,
    },
    groupHeader: {
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
        paddingBottom: Spacing.one,
        borderBottomWidth: 1,
        fontSize: 11,
        letterSpacing: 0.5,
    },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        borderBottomWidth: 1,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: Spacing.one,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButton: {
        borderRadius: Spacing.two,
        padding: Spacing.three,
        alignItems: 'center',
        marginTop: Spacing.two,
    },
    skipButton: {
        alignItems: 'center',
        padding: Spacing.two,
    },
});