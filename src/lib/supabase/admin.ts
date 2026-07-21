import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Service-role client — bypasses RLS entirely. Only import this from server
// actions/route handlers, never from client components or anything that
// ships to the browser. Used for operations RLS deliberately blocks for
// regular users, e.g. updating auctions.current_bid on a new bid (only the
// seller can UPDATE auctions per RLS, but bid totals must be maintained by
// the platform, not by whichever bidder happens to place a bid).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
