  git config --global user.name "strangemotelmusic"
  git config --global user.email "strangemotelmusic@gmail.com"

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  GITHUB PERSONAL TOKEN 

 ---
  The Stack You Already Have
  
  - Supabase — auth, database (12 tables already deployed), realtime, file storage
  - Next.js — frontend (done)
  - Stripe — payments/escrow (not yet wired)
  - OpenAI — AI matchmaker (future)

  The database schema is already live. Auth code is already written in signin/signup. Realtime bid subscription is already in
  AuctionRoom. The foundation is real — it just needs to be connected.

  ---
  Phase 1 — Auth & Sessions (1–2 days)
  
  What's needed:
  - Email confirmation flow (Supabase sends a verify email on signup — needs to be enabled in Supabase dashboard)
  - Protected routes — if you're not signed in and hit /dashboard, redirect to /signin
  - Session persistence — stay logged in across page refreshes
  - Nav shows your name/avatar when signed in instead of "Sign In"
  
  What already works: supabase.auth.signUp() and signInWithPassword() are already wired. Users can technically sign up right now —
  emails just aren't verified yet.

  ---
  Phase 2 — Image Uploads & Storage (2–3 days)

  What's needed:
  - Create Supabase Storage buckets: bird-photos, fly-videos, profile-avatars
  - Set bucket policies (public read, authenticated write)
  - Build an upload form component that:
    - Lets breeders drag/drop or select photos
    - Uploads to Supabase Storage, gets back a public URL
    - Saves URL to the bird_photos table
  - Show real uploaded photos on bird listing pages
  
  This unlocks: breeders can actually submit birds with their own photos

  ---
  Phase 3 — Bird Listings CRUD (3–4 days)
  
  What's needed:
  - "List a Bird" form on the dashboard (ring number, color, sex, breed, description, opening bid, auction date)
  - Save to birds table + auctions table in Supabase
  - Browse page reads from the database instead of the hardcoded array
  - Bird listing page (/birds/[id]) fetches real bird data by ID 
  - Breeder can edit/delete their own listings
  
  This unlocks: real birds listed by real breeders show up for real buyers

  ---
  Phase 4 — Live Bidding (2–3 days)
  
  What's needed:
  - "Place Bid" button writes a row to the bids table
  - AuctionRoom realtime subscription (already written) picks it up and updates the UI instantly for all watchers
  - Bid validation: new bid must be higher than current highest
  - Auction closes when countdown hits zero — winner recorded
  
  What already works: the realtime subscription code in AuctionRoom.tsx is already there. It just needs real auction IDs and real bids
  in the database.

  ---
  Phase 5 — Dashboard with Real Data (2–3 days)

  What's needed:
  - Dashboard fetches real user profile from profiles table
  - "My Listings" shows birds from birds table where owner_id = current user
  - "Active Bids" shows bids from bids table where bidder_id = current user
  - "Recent Sales" shows completed auctions
  - Notifications pull from real bid events

  ---
  Phase 6 — Pedigree Registry (2–3 days)

  What's needed:
  - "Register a Bird" form that saves to birds with sire_id and dam_id fields
  - Pedigree tree on /pedigree renders from real database relationships
  - Search by ring number queries the database

  ---
  Phase 7 — Payments / Escrow (1 week)

  What's needed:
  - Stripe account (free to create)
  - Stripe Connect — lets breeders connect their own bank account to receive payouts
  - When auction closes: charge buyer's card → funds held in Stripe
  - When buyer confirms delivery: release funds to seller's connected account
  - Dispute flow: hold funds if buyer opens a claim
  
  This is the most complex piece but also the most important for trust.

  ---
  Phase 8 — AI Matchmaker (2–3 days once pedigree data exists)

  What's needed:
  - OpenAI API key
  - Server-side API route that takes a bird's pedigree and queries OpenAI
  - Returns suggested breeding pairs from the platform's registered birds
  - Show results in a clean UI on the dashboard

  ---
  Recommended Order

  Phase 1 → Auth & sessions         ← do this first, everything depends on it
  Phase 2 → Image uploads           ← breeders need this to list real birds
  Phase 3 → Bird listings CRUD      ← core marketplace function
  Phase 4 → Live bidding            ← the main event
  Phase 5 → Real dashboard          ← flows naturally after 1–4
  Phase 6 → Pedigree registry       ← differentiator feature
  Phase 7 → Stripe payments         ← required before real money moves
  Phase 8 → AI matchmaker           ← premium feature, last

  ---
  What You Need to Do Outside of Code
  
  1. Supabase dashboard — enable email confirmation, create Storage buckets
  2. Stripe — create account, set up Connect for marketplace payouts
  3. Domain — point your custom domain to Vercel (if not done)
  4. OpenAI — API key when you're ready for Phase 8

  ---
  Where do you want to start? Phase 1 (auth + protected routes) is the natural first move — once sessions work, everything else builds
  on top of it.
