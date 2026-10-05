import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import {
    CommitteeCodeMode,
    claimCommitteeMembership,
    getVerifiedEmail,
    sendCommitteeCode,
    verifyCommitteeCode,
} from '@/utils/queries/committee';

type Props = {
    confirmed: boolean;
    onConfirmed: () => void;
    colors: typeof Colors.light;
};

export default function CommitteeVerify({ confirmed, onConfirmed, colors }: Props) {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [mode, setMode] = useState<CommitteeCodeMode | null>(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // If they already verified an email earlier (e.g. after a profile reset), re-claim without a new code.
    useEffect(() => {
        if (confirmed) return;
        (async () => {
            const verified = await getVerifiedEmail();
            if (!verified) return;
            setEmail(verified);
            try {
                if (await claimCommitteeMembership()) onConfirmed();
            } catch {
                // Fall through to the manual flow.
            }
        })();
        // Only on mount; onConfirmed changes identity on every parent render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (confirmed) {
        return (
            <ThemedText type="small" style={{ color: colors.teal }}>
                ✓ Verified committee member
            </ThemedText>
        );
    }

    const handleSend = async () => {
        if (!email.includes('@')) {
            setMessage('Enter the email the committee has on file.');
            return;
        }
        setBusy(true);
        setMessage(null);
        try {
            setMode(await sendCommitteeCode(email));
            setMessage(`We sent a code to ${email.trim()}.`);
        } catch (e: any) {
            setMessage(e?.message ?? 'Could not send a code. Try again.');
        } finally {
            setBusy(false);
        }
    };

    const handleVerify = async () => {
        if (!mode) return;
        setBusy(true);
        setMessage(null);
        try {
            if (await verifyCommitteeCode(email, code, mode)) {
                onConfirmed();
            } else {
                setMessage("That email isn't on the committee roster. Check with the committee chair.");
            }
        } catch (e: any) {
            setMessage(e?.message ?? 'That code did not work. Try again.');
        } finally {
            setBusy(false);
        }
    };

    const inputStyle = [styles.input, { backgroundColor: colors.background, color: colors.text }];

    return (
        <ThemedView type="backgroundElement" style={styles.container}>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Verify with the email the committee has on file to unlock committee features.
            </ThemedText>

            {mode === null ? (
                <View style={styles.row}>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                        style={[inputStyle, styles.flex]}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={busy}
                        style={[styles.button, { backgroundColor: colors.text }]}>
                        <ThemedText type="small" style={{ color: colors.background, fontWeight: '600' }}>
                            {busy ? 'Sending...' : 'Send code'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <View style={styles.row}>
                        <TextInput
                            value={code}
                            onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                            placeholder="Code"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="number-pad"
                            autoComplete="one-time-code"
                            textContentType="oneTimeCode"
                            maxLength={10}
                            style={[inputStyle, styles.flex]}
                        />
                        <TouchableOpacity
                            onPress={handleVerify}
                            disabled={busy || code.length === 0}
                            style={[styles.button, { backgroundColor: colors.text }]}>
                            <ThemedText type="small" style={{ color: colors.background, fontWeight: '600' }}>
                                {busy ? 'Checking...' : 'Verify'}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => { setMode(null); setCode(''); setMessage(null); }}>
                        <ThemedText type="small" style={{ color: colors.textSecondary }}>
                            Use a different email
                        </ThemedText>
                    </TouchableOpacity>
                </>
            )}

            {message && (
                <ThemedText type="small" style={{ color: colors.textSecondary }}>{message}</ThemedText>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.three,
        borderRadius: Spacing.two,
        gap: Spacing.two,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    flex: {
        flex: 1,
    },
    input: {
        borderRadius: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        fontSize: 16,
    },
    button: {
        borderRadius: Spacing.two,
        paddingHorizontal: Spacing.three,
        justifyContent: 'center',
    },
});
