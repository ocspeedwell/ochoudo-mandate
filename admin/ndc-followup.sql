-- Run once in Supabase SQL editor. Only authorised OMG admins may access flags.
create table if not exists public.omg_ndc_followups (
 member_id uuid primary key references public.members(id) on delete cascade,
 flagged boolean not null default true,
 note text not null default '',
 updated_at timestamptz not null default now(),
 updated_by uuid default auth.uid()
);
alter table public.omg_ndc_followups enable row level security;
revoke all on public.omg_ndc_followups from anon;
grant select,insert,update,delete on public.omg_ndc_followups to authenticated;
drop policy if exists omg_ndc_followups_admin on public.omg_ndc_followups;
create policy omg_ndc_followups_admin on public.omg_ndc_followups for all to authenticated
 using ((select public.is_omg_admin())) with check ((select public.is_omg_admin()));
