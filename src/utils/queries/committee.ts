import { supabase } from '@/utils/supabase';

// 'link'   — attach the email to the current anonymous user (keeps their favorites).
// 'signin' — the email already belongs to an account (e.g. reinstalled app), so sign into that one.
export type CommitteeCodeMode = 'link' | 'signin';

export async function sendCommitteeCode(email: string): Promise<CommitteeCodeMode> {
    const normalized = email.trim().toLowerCase();

    const { error } = await supabase.auth.updateUser({ email: normalized });
    if (!error) return 'link';

    if (error.code !== 'email_exists') throw error;

    const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { shouldCreateUser: false },
    });
    if (otpError) throw otpError;
    return 'signin';
}

// Verifies the emailed code, then asks the server to match the verified email
// against the committee roster. Returns true if they're on the roster.
export async function verifyCommitteeCode(
    email: string,
    token: string,
    mode: CommitteeCodeMode
): Promise<boolean> {
    const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: mode === 'link' ? 'email_change' : 'email',
    });
    if (error) throw error;

    return claimCommitteeMembership();
}

// Safe to call any time: returns false unless the user has a verified email on the roster.
export async function claimCommitteeMembership(): Promise<boolean> {
    const { data, error } = await supabase.rpc('claim_committee_membership');
    if (error) throw error;
    return data === true;
}

export async function getVerifiedEmail(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    return user?.email && user.email_confirmed_at ? user.email : null;
}
