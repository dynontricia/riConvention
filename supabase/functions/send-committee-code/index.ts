// Supabase Edge Function (Deno). Deploy: Dashboard > Edge Functions, or `supabase functions deploy send-committee-code`.
//
// POST { email } -> { found: boolean }
// If the email is on the committee roster, stores a hashed 6-digit code on
// that row (10 min expiry) and emails the code via Resend.
//
// Secrets (Dashboard > Edge Functions > Secrets, or `supabase secrets set`):
//   RESEND_API_KEY    - from resend.com
//   CODE_FROM_EMAIL   - e.g. "RI Convention <noreply@yourdomain.org>"
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function sha256Hex(text: string): Promise<string> {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const { email } = await req.json();
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    if (!cleanEmail) return json({ error: 'email_required' }, 400);

    // Service role bypasses RLS, so this function can read the private roster.
    const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: member, error } = await admin
        .from('committee_members')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();
    if (error) return json({ error: 'lookup_failed' }, 500);
    if (!member) return json({ found: false });

    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');

    const { error: updateError } = await admin
        .from('committee_members')
        .update({
            code_hash: await sha256Hex(code),
            code_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
            code_attempts: 0,
        })
        .eq('id', member.id);
    if (updateError) return json({ error: 'save_failed' }, 500);

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: Deno.env.get('CODE_FROM_EMAIL'),
            to: cleanEmail,
            subject: 'Your RI Convention committee code',
            text: `Your confirmation code is ${code}. It expires in 10 minutes.`,
        }),
    });
    if (!res.ok) return json({ error: 'email_failed' }, 502);

    return json({ found: true });
});
