-- OMG CARD PRINT REGISTER
-- Run once in Supabase SQL Editor as database owner.
-- This is separate from the TS704 printing/calibration system.
create table if not exists public.omg_card_print_register (
  member_id uuid primary key references public.members(id) on delete cascade,
  status text not null default 'never_printed' check (status in ('never_printed','previously_printed','printed','reprint_damaged')),
  historical_print_date date null,
  first_system_printed_at timestamptz null,
  last_printed_at timestamptz null,
  print_count integer not null default 0 check (print_count >= 0),
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.omg_card_print_register enable row level security;
revoke all on public.omg_card_print_register from anon;
grant select, insert, update on public.omg_card_print_register to authenticated;

-- Reuse the project's existing is_omg_admin() authorization function.
drop policy if exists "OMG admins can read card print register" on public.omg_card_print_register;
create policy "OMG admins can read card print register" on public.omg_card_print_register for select to authenticated using (public.is_omg_admin());
drop policy if exists "OMG admins can insert card print register" on public.omg_card_print_register;
create policy "OMG admins can insert card print register" on public.omg_card_print_register for insert to authenticated with check (public.is_omg_admin());
drop policy if exists "OMG admins can update card print register" on public.omg_card_print_register;
create policy "OMG admins can update card print register" on public.omg_card_print_register for update to authenticated using (public.is_omg_admin()) with check (public.is_omg_admin());
