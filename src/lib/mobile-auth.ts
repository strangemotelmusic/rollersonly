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
