import { supabase } from '@/utils/supabase';

// Asks the `send-committee-code` Edge Function to email a code.
// Returns false if the email isn't on the committee roster.
export async function sendCommitteeCode(email: string): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke<{ found: boolean }>('send-committee-code', {
        body: { email },
    });

    if (error) throw error;
    return data?.found ?? false;
}

// Checks the code against the roster row (see supabase/committee_codes.sql).
// Returns true and stamps confirmed_at on the row if it matches.
export async function confirmCommitteeCode(email: string, code: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('confirm_committee_code', {
        p_email: email,
        p_code: code,
    });

    if (error) throw error;
    return data === true;
}
