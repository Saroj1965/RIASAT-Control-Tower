import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://qbotswjhmmquvmhwrawq.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFib3Rzd2pobW1xdXZtaHdyYXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDQ1MDYsImV4cCI6MjEwODI4MDUwNn0.KOCAfyIdsCSkxwYyNI8MVjkkocITfzzTUgkPV3tHW34";
const DEFAULT_SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFib3Rzd2pobW1xdXZtaHdyYXdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjcwNDUwNiwiZXhwIjoyMTA4MjgwNTA2fQ.ZLtiSkq9jp6BZToyJmZT2e5QyM7s6umBF3ltukmSKTI";

/**
 * Cleans and normalizes a Supabase URL so trailing `/rest/v1/`, `/rest/v1`,
 * slashes, or accidental quotes in environment variables never break PostgREST requests.
 */
export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return DEFAULT_SUPABASE_URL;
  let cleaned = rawUrl.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!cleaned || cleaned.includes("your-project-ref")) {
    return DEFAULT_SUPABASE_URL;
  }
  // Remove trailing /rest/v1 or /rest/v1/ or trailing slashes
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    return DEFAULT_SUPABASE_URL;
  }
  return cleaned;
}

function cleanKey(rawKey?: string, fallback: string = ""): string {
  if (!rawKey) return fallback;
  const cleaned = rawKey.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!cleaned || cleaned.includes("your-anon-public-key") || cleaned.includes("your-service-role")) {
    return fallback;
  }
  return cleaned;
}

export function getSupabaseConfig() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    DEFAULT_SUPABASE_URL;

  const url = normalizeSupabaseUrl(rawUrl);

  const anonKey = cleanKey(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      process.env.SUPABASE_KEY,
    DEFAULT_SUPABASE_ANON_KEY
  );

  const serviceKey = cleanKey(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY,
    DEFAULT_SUPABASE_SERVICE_KEY || anonKey
  );

  return { url, anonKey, serviceKey };
}

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const { url, anonKey, serviceKey } = getSupabaseConfig();
  return Boolean(url && url.startsWith("https://") && (anonKey || serviceKey));
}

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const { url, anonKey } = getSupabaseConfig();
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const { url, serviceKey, anonKey } = getSupabaseConfig();
    supabaseAdminInstance = createClient(url, serviceKey || anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminInstance;
}

export function getSupabaseClient(): SupabaseClient {
  return getSupabaseAdmin() || getSupabase();
}
