import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _browserClient: SupabaseClient | null = null;

/** Browser/client-side Supabase client (uses anon key). Lazily created. */
export function getSupabase() {
  if (!_browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    _browserClient = createClient(url, key);
  }
  return _browserClient;
}

/** Server-side Supabase client (uses service role key — never expose to browser) */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase env vars are not set");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
