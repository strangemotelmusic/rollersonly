-- RollersOnly — live schema as deployed in Supabase, captured 2026-07-21
-- via information_schema/pg_catalog introspection. This is documentation of
-- the ACTUAL live schema, not a migration to (re-)run. Regenerate by asking
-- Claude to re-run the schema-introspection query from the SQL Editor.
--
-- RLS is enabled on every table below. Every table has a public SELECT
-- policy (qual: true) — the marketplace is readable by anyone, signed in or
-- not. INSERT/UPDATE policies check auth.uid() against an owner column.
-- No DELETE policies exist on any table — nothing can be deleted via the
-- client (anon/authenticated roles), only via the service role key.
-- No Storage buckets exist yet (bird-photos, avatars, etc. need creating).

create table profiles (
  id uuid primary key references auth.users(id),
  username text not null,
  full_name text,
  avatar_url text,
  location text,
  bio text,
  tier text not null default 'fancier', -- 'fancier' | 'breeder' | 'elite' — currently self-reported at signup, NOT payment-verified
  is_verified boolean default false,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- policies: insert/update/select-own via auth.uid() = id; select-all (public) also allowed

create table lofts (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id),
  name text not null,
  slug text not null,
  location text,
  country text,
  description text,
  logo_url text,
  banner_url text,
  is_elite boolean default false,
  elite_verified_at timestamptz,
  total_birds_sold integer default 0,
  total_championships integer default 0,
  rating numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- policies: owner insert/update via auth.uid() = owner_id; select public

create table birds (
  id uuid primary key default uuid_generate_v4(),
  platform_id text not null, -- public-facing ring/lot identifier shown to buyers
  loft_id uuid references lofts(id),
  owner_id uuid not null references profiles(id),
  name text,
  ring_number text,
  sex text,
  color text,
  mutation text,
  birth_year integer,
  birth_month integer,
  sire_id uuid references birds(id),
  dam_id uuid references birds(id),
  fly_score numeric,
  kit_score numeric,
  roll_quality text,
  health_certified boolean default false,
  health_cert_date date,
  health_cert_url text,
  dna_certified boolean default false,
  dna_cert_date date,
  dna_cert_url text,
  primary_photo_url text,
  is_active boolean default true,
  notes text,
  certification_status text not null default 'none',
  certification_requested_at timestamptz,
  certified_at timestamptz,
  bred_from_pair_id uuid references breeding_pairs(id), -- added with breeding_pairs, see below
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- policies: owner insert/update via auth.uid() = owner_id; select public

-- Casual day-to-day fly notes (depth/frequency/kit behavior), distinct from
-- the verified, competition-grade bird_results table below.
create table fly_log_entries (
  id uuid primary key default gen_random_uuid(),
  bird_id uuid not null references birds(id) on delete cascade,
  owner_id uuid not null references profiles(id),
  logged_at date not null default current_date,
  depth text,
  frequency text,
  kit_behavior text,
  notes text,
  created_at timestamptz not null default now()
);
-- policies: owner full access via auth.uid() = owner_id; no public select

create table breeding_seasons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  loft_id uuid references lofts(id),
  label text not null,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);
-- policies: owner full access via auth.uid() = owner_id; no public select

-- Offspring aren't a separate table — they're just birds with matching
-- sire_id/dam_id (optionally bred_from_pair_id for traceability).
create table breeding_pairs (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references breeding_seasons(id) on delete cascade,
  owner_id uuid not null references profiles(id),
  sire_id uuid not null references birds(id),
  dam_id uuid not null references birds(id),
  paired_at date,
  egg_count integer not null default 0,
  hatched_count integer not null default 0,
  status text not null default 'active', -- 'active' | 'split' | 'retired'
  notes text,
  created_at timestamptz not null default now()
);
-- policies: owner full access via auth.uid() = owner_id; no public select

-- ORPHANED as of the Family Tree split: fly_log_entries, breeding_seasons,
-- and breeding_pairs above (and birds.bred_from_pair_id) are no longer
-- referenced anywhere in the app. Marketplace bird registration and pedigree
-- tracking used to be linked (registering a bird auto-populated a public
-- pedigree registry); that coupling was intentionally undone. Pedigree,
-- breeding, and fly-log tracking now live entirely in the tables below,
-- fully independent of the marketplace `birds` table. Left in place rather
-- than dropped since they were briefly live in production.

-- Family Tree is a separate product from the marketplace: a bird listed for
-- auction and a bird tracked in a pedigree are unrelated records, on
-- purpose. Access to these tables' features is gated by profiles.tier in
-- the app layer (fancier=registry, breeder=+breeding, elite=+performance).
create table family_tree_birds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  name text,
  ring_number text,
  sex text,
  color text,
  birth_year integer,
  sire_id uuid references family_tree_birds(id),
  dam_id uuid references family_tree_birds(id),
  primary_photo_url text,
  photo_settings jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- policies: select public (so Registry can show pedigrees to lookyloos); owner insert/update via auth.uid() = owner_id

create table family_tree_seasons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  label text not null,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);
-- policies: owner full access via auth.uid() = owner_id; no public select

create table family_tree_pairs (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references family_tree_seasons(id) on delete cascade,
  owner_id uuid not null references profiles(id),
  sire_id uuid not null references family_tree_birds(id),
  dam_id uuid not null references family_tree_birds(id),
  paired_at date,
  egg_count integer not null default 0,
  hatched_count integer not null default 0,
  status text not null default 'active', -- 'active' | 'split' | 'retired'
  notes text,
  created_at timestamptz not null default now()
);
-- policies: owner full access via auth.uid() = owner_id; no public select

create table family_tree_fly_log (
  id uuid primary key default gen_random_uuid(),
  bird_id uuid not null references family_tree_birds(id) on delete cascade,
  owner_id uuid not null references profiles(id),
  logged_at date not null default current_date,
  depth text,
  frequency text,
  kit_behavior text,
  notes text,
  created_at timestamptz not null default now()
);
-- policies: owner full access via auth.uid() = owner_id; no public select

create table bird_photos (
  id uuid primary key default uuid_generate_v4(),
  bird_id uuid not null references birds(id),
  url text not null,
  is_primary boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);
-- policies: insert only if bird_id's owner_id = auth.uid(); select public

create table bird_results (
  id uuid primary key default uuid_generate_v4(),
  bird_id uuid not null references birds(id),
  competition_name text not null,
  competition_date date,
  placement integer,
  score numeric,
  category text,
  organization text,
  verified boolean default false,
  notes text,
  created_at timestamptz default now()
);
-- no policies captured for this table specifically (check RLS before use)

create table competitions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  organization text not null,
  season text,
  location text,
  competition_date date,
  category text,
  is_verified boolean default false,
  created_at timestamptz default now()
);
-- policies: select public

create table leaderboard_entries (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references competitions(id),
  loft_id uuid not null references lofts(id),
  bird_id uuid references birds(id),
  placement integer not null,
  score numeric,
  kit_size integer,
  notes text,
  created_at timestamptz default now()
);
-- policies: select public (no insert policy captured — likely service-role only)

create table auctions (
  id uuid primary key default uuid_generate_v4(),
  bird_id uuid not null references birds(id),
  seller_id uuid not null references profiles(id),
  loft_id uuid references lofts(id),
  title text not null,
  description text,
  reserve_price numeric not null default 0,
  starting_bid numeric not null,
  current_bid numeric,
  buy_now_price numeric,
  bid_increment numeric not null default 25,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled', -- observed default only; full enum of values not confirmed
  video_url text,
  video_submitted_at timestamptz,
  winner_id uuid references profiles(id),
  final_price numeric,
  escrow_held boolean default false,
  escrow_released boolean default false,
  escrow_released_at timestamptz,
  shipping_confirmed_at timestamptz,
  buyer_confirmed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- policies: seller insert/update via auth.uid() = seller_id; select public

create table bids (
  id uuid primary key default uuid_generate_v4(),
  auction_id uuid not null references auctions(id),
  bidder_id uuid not null references profiles(id),
  amount numeric not null,
  is_winning boolean default false,
  created_at timestamptz default now()
);
-- policies: insert via auth.uid() = bidder_id; select public; no update policy (is_winning must be maintained server-side/service-role)

create table fly_videos (
  id uuid primary key default uuid_generate_v4(),
  loft_id uuid not null references lofts(id),
  uploader_id uuid not null references profiles(id),
  title text not null,
  video_url text not null,
  thumbnail_url text,
  competition_id uuid references competitions(id),
  description text,
  view_count integer default 0,
  created_at timestamptz default now()
);
-- policies: insert via auth.uid() = uploader_id; select public

create table loft_reviews (
  id uuid primary key default uuid_generate_v4(),
  loft_id uuid not null references lofts(id),
  reviewer_id uuid not null references profiles(id),
  auction_id uuid references auctions(id),
  rating integer not null,
  body text,
  created_at timestamptz default now()
);
-- policies: insert via auth.uid() = reviewer_id; select public

create table matchmaking_requests (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references profiles(id),
  bird_a_id uuid not null references birds(id),
  bird_b_id uuid not null references birds(id),
  ai_analysis text,
  inbreeding_coefficient numeric,
  recommendation text,
  common_ancestors jsonb,
  created_at timestamptz default now()
);
-- policies: insert via auth.uid() = requester_id; select own only (not public)

-- Not yet built: no table exists for magazine content ("Decade of the Spinner").
-- Needs its own table (e.g. magazine_issues) plus a paid-tier gate — profiles.tier
-- is the natural gate column, but only once Stripe actually writes to it.

create table vip_comp_tiers (
  email text primary key,
  tier text not null check (tier in ('fancier','breeder','elite')),
  created_at timestamptz not null default now()
);
alter table vip_comp_tiers enable row level security;
-- No policies — service-role only. This table holds real people's email
-- addresses (comp accounts granted a paid tier for free); it must never be
-- readable by anon/authenticated roles or committed as data into source
-- (this repo is public). ensureProfile() checks it via the admin client on
-- every sign-in and bumps profiles.tier to match if the account is under-tier.

-- Bulk email / subscriber list. Two sources feed one admin "Send Campaign"
-- flow: existing members (profiles, auto-enrolled unless they opt out) and
-- a standalone newsletter signup for people without an account.
alter table profiles add column if not exists marketing_opt_out boolean not null default false;
alter table profiles add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  unsubscribe_token uuid not null default gen_random_uuid(),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
alter table newsletter_subscribers enable row level security;
-- No anon/authenticated policies — all reads/writes go through the
-- service-role admin client (subscribeToNewsletter action, unsubscribe
-- route, admin send flow), same reasoning as vip_comp_tiers.

create table email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  recipient_count integer not null default 0,
  sent_by uuid references profiles(id),
  sent_at timestamptz not null default now()
);
alter table email_campaigns enable row level security;
-- No policies — service-role only. Just a send log for the admin dashboard.

-- Family Tree became its own standalone $40/yr add-on, fully decoupled from
-- the marketplace subscription tier (elite gets it bundled free; everyone
-- else pays separately). A customer can now have two unrelated Stripe
-- Customer objects — one for the marketplace tier subscription
-- (profiles.stripe_customer_id, unchanged) and one for the add-on
-- (profiles.family_tree_addon_customer_id, new) — since a static Stripe
-- Payment Link always creates its own Customer rather than reusing an
-- existing one. The webhook keys each sync path off its own customer-id
-- column so a lifecycle event on one product can never touch the other.
alter table profiles add column if not exists family_tree_addon_active boolean not null default false;
alter table profiles add column if not exists family_tree_addon_customer_id text;

-- Admin photo uploads (Future Issue covers, D.O.T.S. birds) moved from
-- routing through a server action (client -> Vercel -> Supabase, and capped
-- at Next's 1MB default server-action body size) to uploading straight from
-- the admin's browser session to Supabase Storage. That requires an insert
-- policy for the authenticated admin, since these buckets previously only
-- ever got written to via the service-role client.
create policy "admins can upload future issue covers"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'future-issue-covers'
  and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

create policy "admins can upload dots birds photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'dots-birds'
  and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
