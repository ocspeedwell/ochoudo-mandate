-- OMG referral tracking: run as database owner after taking a backup.
-- Does not modify existing members or the register_membership function.
create extension if not exists pgcrypto;
create table if not exists public.omg_referral_claims (
 id uuid primary key default gen_random_uuid(),
 member_id text not null unique,
 referrer_code text,
 referrer_name text,
 status text not null default 'pending' check(status in ('pending','verified','unmatched','rejected')),
 verified_referrer_id uuid references public.members(id) on delete set null,
 created_at timestamptz not null default now(),
 verified_at timestamptz,
 check (nullif(btrim(coalesce(referrer_code,'')),'') is not null or nullif(btrim(coalesce(referrer_name,'')),'') is not null)
);
create index if not exists omg_referral_claims_referrer_idx on public.omg_referral_claims(verified_referrer_id);
alter table public.omg_referral_claims enable row level security;
revoke all on public.omg_referral_claims from anon,authenticated;
grant select,update on public.omg_referral_claims to authenticated;
create policy "OMG admin view referrals" on public.omg_referral_claims for select to authenticated using ((select public.is_omg_admin()));
create policy "OMG admin update referrals" on public.omg_referral_claims for update to authenticated using ((select public.is_omg_admin())) with check ((select public.is_omg_admin()));
-- This function records an unverified claim, not a confirmed referral.
-- The phone is checked against the newly registered member. No member data is returned.
create or replace function public.omg_record_referral(p_member_id text,p_phone text,p_referral_code text default null,p_referral_name text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_matches integer;
begin
 if length(coalesce(p_member_id,'')) not between 1 and 80 or length(coalesce(p_phone,'')) not between 7 and 32 then return 'INVALID_INPUT'; end if;
 if length(coalesce(p_referral_code,'')) > 80 or length(coalesce(p_referral_name,'')) > 150 then return 'INVALID_INPUT'; end if;
 if nullif(btrim(coalesce(p_referral_code,'')),'') is null and nullif(btrim(coalesce(p_referral_name,'')),'') is null then return 'NO_REFERRER'; end if;
 select m.id into v_id from public.members m where m.member_id=p_member_id and m.phone=p_phone limit 1;
 if v_id is null then return 'MEMBER_NOT_FOUND'; end if;
 -- Avoid overwriting existing claims; all new claims remain pending administrator review.
 insert into public.omg_referral_claims(member_id,referrer_code,referrer_name)
 values(p_member_id,nullif(btrim(p_referral_code),''),nullif(btrim(p_referral_name),'')) on conflict(member_id) do nothing;
 return 'RECORDED';
end; $$;
revoke all on function public.omg_record_referral(text,text,text,text) from public;
grant execute on function public.omg_record_referral(text,text,text,text) to anon,authenticated;
-- Report view accessible only through underlying admin-only RLS.
create or replace view public.omg_referral_summary with (security_invoker=true) as
select c.verified_referrer_id, m.member_id as referrer_code,m.full_name as referrer_name,
 count(*) filter (where c.status='verified') as verified_referrals,
 count(*) filter (where c.status='pending') as pending_claims
from public.omg_referral_claims c left join public.members m on m.id=c.verified_referrer_id
 group by c.verified_referrer_id,m.member_id,m.full_name;
revoke all on public.omg_referral_summary from anon;
grant select on public.omg_referral_summary to authenticated;
