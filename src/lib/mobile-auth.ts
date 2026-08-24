import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The mobile app has no cookies to carry a session, so it sends its Supabase
// access token as a Bearer header instead. The service-role client can
// verify any user's token via auth.getUser(token) - this is the standard
// way to authenticate a bearer token server-side without a second Supabase
// project/key. Route Handlers under src/app/api/mobile/* all start here.
export async function requireMobileUser(request: NextRequest): Promise<{ error: string; status: number } | { userId: string }> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { error: "Missing bearer token.", status: 401 };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { error: "Invalid or expired session.", status: 401 };

  return { userId: data.user.id };
}

// Every admin Route Handler under src/app/api/mobile/admin/* starts here
// instead of requireMobileUser - same bearer-token check, plus the
// profiles.is_admin gate every web admin page/action re-implements
// individually. Centralized here rather than copy-pasted per route.
export async function requireMobileAdmin(
  request: NextRequest
): Promise<{ error: string; status: number } | { userId: string; admin: ReturnType<typeof createAdminClient> }> {
  const auth = await requireMobileUser(request);
  if ("error" in auth) return auth;

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", auth.userId).maybeSingle();
  if (!profile?.is_admin) return { error: "Admins only.", status: 403 };

  return { userId: auth.userId, admin };
}
