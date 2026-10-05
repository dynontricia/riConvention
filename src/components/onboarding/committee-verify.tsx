import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmCommitteeCode, sendCommitteeCode } from '@/utils/queries/committee';
import { getConfirmedCommitteeEmail, setConfirmedCommitteeEmail } from '@/utils/storage';

// Shown under the "I am a Convention Committee Member" checkbox.
// Two steps: email -> emailed 6-digit code. On success the email is saved on
// this device, and the roster row is stamped confirmed_at on the server.

type Step = 'loading' | 'email' | 'code' | 'confirmed';

export default function CommitteeVerify() {
    const colors = useTheme();

    const [step, setStep] = useState<Step>('loading');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        getConfirmedCommitteeEmail().then((saved) => {
            if (saved) {
                setEmail(saved);
                setStep('confirmed');
            } else {
                setStep('email');
            }
        });
    }, []);

    const handleSendCode = async () => {
        setBusy(true);
        setMessage('');
        try {
            const found = await sendCommitteeCode(email.trim());
            if (found) {
                setStep('code');
                setMessage(`We emailed a code to ${email.trim()}. It expires in 10 minutes.`);
            } else {
                setMessage("That email isn't on the committee list. Check with the committee chair.");
            }
        } catch {
            setMessage("Couldn't send the code. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const handleConfirm = async () => {
        setBusy(true);
        setMessage('');
        try {
            const ok = await confirmCommitteeCode(email.trim(), code.trim());
            if (ok) {
                await setConfirmedCommitteeEmail(email.trim().toLowerCase());
                setStep('confirmed');
            } else {
                setMessage("That code didn't work. It may be wrong or expired.");
            }
        } catch {
            setMessage("Couldn't check the code. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    if (step === 'loading') return null;

    if (step === 'confirmed') {
        return (
            <ThemedText type="small" style={{ color: colors.teal, fontWeight: '600' }}>
                ✓ Confirmed committee member ({email})
            </ThemedText>
        );
    }

    const inputStyle = [styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }];

    return (
        <View style={styles.container}>
            {step === 'email' ? (
                <>
                    <ThemedText type="small" style={styles.label}>Committee Email</ThemedText>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={inputStyle}
                    />
                    <TouchableOpacity
                        onPress={handleSendCode}
                        disabled={busy || !email.trim()}
                        style={[styles.button, { borderColor: colors.teal, opacity: busy || !email.trim() ? 0.5 : 1 }]}>
                        <ThemedText type="small" style={{ color: colors.teal, fontWeight: '600' }}>
                            {busy ? 'Sending...' : 'Send Code'}
                        </ThemedText>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <ThemedText type="small" style={styles.label}>6-Digit Code</ThemedText>
                    <TextInput
                        value={code}
                        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="number-pad"
                        maxLength={6}
                        style={inputStyle}
                    />
                    <TouchableOpacity
                        onPress={handleConfirm}
                        disabled={busy || code.length !== 6}
                        style={[styles.button, { borderColor: colors.teal, opacity: busy || code.length !== 6 ? 0.5 : 1 }]}>
                        <ThemedText type="small" style={{ color: colors.teal, fontWeight: '600' }}>
                            {busy ? 'Checking...' : 'Confirm'}
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { setStep('email'); setCode(''); setMessage(''); }}
                        style={styles.linkButton}>
                        <ThemedText type="small" style={{ color: colors.teal }}>Use a different email</ThemedText>
                    </TouchableOpacity>
                </>
            )}

            {message !== '' && (
                <ThemedText type="small">{message}</ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.two,
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
    button: {
        borderRadius: Spacing.two,
        borderWidth: 2,
        padding: Spacing.two,
        alignItems: 'center',
    },
    linkButton: {
        alignItems: 'center',
        padding: Spacing.one,
    },
});
