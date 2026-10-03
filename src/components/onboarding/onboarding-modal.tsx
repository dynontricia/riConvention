import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import ProfileForm, { ProfileFormValues } from '@/components/onboarding/profile-form';
import { saveUserName, setHasOnboarded } from '@/utils/storage';
import { saveProfile } from '@/utils/queries/profile';

type Props = {
    visible: boolean;
    onDismiss: () => void;
};

export default function OnboardingModal({ visible, onDismiss }: Props) {

    const handleSave = async (values: ProfileFormValues) => {
        // Save name to device only
        await saveUserName(values.firstName, values.lastInitial);

        // Save area + service data to Supabase
        await saveProfile(values.homeGroup, values.servicePositions, values.interests, values.isConventionCommittee);

        // Mark onboarding complete so modal never auto-shows again
        await setHasOnboarded();

        onDismiss();
    };

    const handleSkip = async () => {
        // Mark as onboarded even if skipped so we don't keep asking
        await setHasOnboarded();
        onDismiss();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet">
            <ThemedView style={styles.container}>
                <SafeAreaView style={styles.safeArea}>

                    {/* Header */}
                    <View style={styles.header}>
                        <ThemedText type="title" style={styles.title}>
                            Welcome to{'\n'}the 2027 RI{'\n'}State Convention!
                        </ThemedText>
                        <ThemedText type="small" themeColor="teal" style={styles.subtitle}>
                            Tell us a little about yourself to personalize your experience.
                            This is completely optional.
                        </ThemedText>
                    </View>

                    {/* Form */}
                    <ProfileForm
                        onSave={handleSave}
                        onSkip={handleSkip}
                        showSkip={true}
                    />

                </SafeAreaView>
            </ThemedView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        paddingBottom: Spacing.two,
        gap: Spacing.two,
    },
    title: {
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
    },
});