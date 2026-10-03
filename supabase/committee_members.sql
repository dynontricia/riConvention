-- Convention Committee roster.
-- Run in the Supabase SQL Editor. Add/edit members via the Table Editor.

create table if not exists public.committee_members (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    email       text not null unique,
    role        text,                                        -- e.g. 'Chair', 'Hospitality'
    user_id     uuid unique references auth.users (id) on delete set null,  -- filled in once they verify
    created_at  timestamptz not null default now()
);

-- Store emails lowercase so matching is case-insensitive.
create or replace function public.committee_members_lower_email()
returns trigger language plpgsql as $$
begin
    new.email := lower(trim(new.email));
    return new;
end;
$$;

drop trigger if exists committee_members_lower_email on public.committee_members;
create trigger committee_members_lower_email
    before insert or update on public.committee_members
    for each row execute function public.committee_members_lower_email();

-- RLS on with no policies: the app can't read the roster (keeps names/emails private).
-- You manage it from the dashboard, which bypasses RLS.
alter table public.committee_members enable row level security;

-- Example rows:
-- insert into public.committee_members (name, email, role) values
--     ('Tricia I.', 'someone@example.com', 'Chair');
