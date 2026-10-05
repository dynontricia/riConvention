-- Committee confirmation by emailed code. No Supabase Auth users involved.
-- Run in the SQL Editor AFTER supabase/committee_members.sql from the repo.
--
-- Flow:
--   1. App calls Edge Function `send-committee-code` with an email.
--      If the email is in committee_members, it stores a hashed 6-digit code
--      (10 min expiry) on that row and emails the code.
--   2. App calls confirm_committee_code(email, code) below.
--      If it matches, the row is stamped confirmed_at and the code is cleared.

-- 1. Extra columns on the roster.
alter table public.committee_members
    add column if not exists code_hash        text,          -- sha256 of the code, never the code itself
    add column if not exists code_expires_at  timestamptz,
    add column if not exists code_attempts    int not null default 0,
    add column if not exists confirmed_at     timestamptz;   -- the "this row is confirmed" stamp

-- RLS stays on with no policies (from committee_members.sql), so the app
-- still can't read or write the table directly. The two doors in are the
-- Edge Function (service role) and this function (security definer).

-- 2. Check a code. Returns true and stamps the row if it matches.
create or replace function public.confirm_committee_code(p_email text, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions          -- digest() lives in the extensions schema on Supabase
as $$
declare
    r public.committee_members;
begin
    select * into r
    from public.committee_members
    where email = lower(trim(p_email))
    for update;

    if r.id is null
       or r.code_hash is null
       or r.code_expires_at < now()
       or r.code_attempts >= 5 then
        return false;
    end if;

    if r.code_hash <> encode(digest(trim(p_code), 'sha256'), 'hex') then
        update public.committee_members
           set code_attempts = code_attempts + 1
         where id = r.id;
        return false;
    end if;

    update public.committee_members
       set confirmed_at    = now(),
           code_hash       = null,
           code_expires_at = null,
           code_attempts   = 0
     where id = r.id;
    return true;
end;
$$;

revoke all on function public.confirm_committee_code(text, text) from public;
grant execute on function public.confirm_committee_code(text, text) to anon, authenticated;

-- Optional: user_id (FK to auth.users) isn't used by this design.
-- alter table public.committee_members drop column if exists user_id;
