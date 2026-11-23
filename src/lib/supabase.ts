// =========================================================================
// SUPABASE CLIENT CONFIGURATION (SERVER & AUTH CLIENT)
// =========================================================================
// Security Policy:
// 1. NEVER hardcode or expose a Supabase service_role key or secret key in
//    source code or client bundles.
// 2. The public URL and anon key are safe for Supabase Auth operations,
//    while database security is enforced via Row Level Security (RLS) on
//    Supabase tables for the `authenticated` role.
// 3. Privileged admin actions (such as creating/disabling users in Supabase
//    Auth) use SUPABASE_SERVICE_ROLE_KEY strictly from server-side
//    environment variables when configured.

const DEFAULT_SUPABASE_URL = "https://qbotswjhmmquvmhwrawq.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFib3Rzd2pobW1xdXZtaHdyYXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDQ1MDYsImV4cCI6MjEwODI4MDUwNn0.KOCAfyIdsCSkxwYyNI8MVjkkocITfzzTUgkPV3tHW34";

function cleanEnvValue(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "");
}

export function getSupabaseUrl(): string {
  return (
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    cleanEnvValue(process.env.SUPABASE_URL) ||
    DEFAULT_SUPABASE_URL
  );
}

export function getSupabaseAnonKey(): string {
  return (
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    cleanEnvValue(process.env.SUPABASE_ANON_KEY) ||
    DEFAULT_SUPABASE_ANON_KEY
  );
}

class PostgrestQueryBuilder implements PromiseLike<{ data: any; error: any; count: number | null }> {
  private url: string;
  private apiKey: string;
  private bearerToken: string;
  private table: string;
  private method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private selectColumns: string = "*";
  private returnRepresentation = false;
  private headOnly = false;
  private countMode: "exact" | null = null;
  private filters: string[] = [];
  private orders: string[] = [];
  private limitCount: number | null = null;
  private bodyPayload: any = undefined;
  private isSingle = false;
  private isMaybeSingle = false;
  private upsertOptions: { onConflict?: string; ignoreDuplicates?: boolean } | null = null;

  constructor(url: string, apiKey: string, bearerToken: string, table: string) {
    this.url = url.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.bearerToken = bearerToken;
    this.table = table;
  }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }): this {
    this.selectColumns = columns || "*";
    if (this.method === "POST" || this.method === "PATCH" || this.method === "DELETE") {
      this.returnRepresentation = true;
    } else {
      this.method = "GET";
    }
    if (options?.count === "exact") {
      this.countMode = "exact";
    }
    if (options?.head) {
      this.headOnly = true;
    }
    return this;
  }

  insert(values: any): this {
    this.method = "POST";
    this.bodyPayload = values;
    return this;
  }

  update(values: any): this {
    this.method = "PATCH";
    this.bodyPayload = values;
    return this;
  }

  upsert(values: any, options?: { onConflict?: string; ignoreDuplicates?: boolean }): this {
    this.method = "POST";
    this.bodyPayload = values;
    this.upsertOptions = options || {};
    return this;
  }

  delete(): this {
    this.method = "DELETE";
    return this;
  }

  eq(column: string, value: any): this {
    this.filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(String(value))}`);
    return this;
  }

  neq(column: string, value: any): this {
    this.filters.push(`${encodeURIComponent(column)}=neq.${encodeURIComponent(String(value))}`);
    return this;
  }

  ilike(column: string, value: string): this {
    this.filters.push(`${encodeURIComponent(column)}=ilike.${encodeURIComponent(String(value))}`);
    return this;
  }

  in(column: string, values: any[]): this {
    const joined = values.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(",");
    this.filters.push(`${encodeURIComponent(column)}=in.(${encodeURIComponent(joined)})`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    const dir = options?.ascending === false ? "desc" : "asc";
    this.orders.push(`${encodeURIComponent(column)}.${dir}`);
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  maybeSingle(): this {
    this.isMaybeSingle = true;
    return this;
  }

  private async execute(): Promise<{ data: any; error: any; count: number | null }> {
    try {
      const queryParts: string[] = [];

      if (this.method === "GET" || this.returnRepresentation) {
        queryParts.push(`select=${encodeURIComponent(this.selectColumns)}`);
      }

      if (this.upsertOptions?.onConflict) {
        queryParts.push(`on_conflict=${encodeURIComponent(this.upsertOptions.onConflict)}`);
      }

      for (const f of this.filters) {
        queryParts.push(f);
      }

      if (this.orders.length > 0) {
        queryParts.push(`order=${this.orders.join(",")}`);
      }

      if (this.limitCount !== null) {
        queryParts.push(`limit=${this.limitCount}`);
      }

      const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
      const endpoint = `${this.url}/rest/v1/${encodeURIComponent(this.table)}${qs}`;

      const preferParts: string[] = [];
      if (this.returnRepresentation) {
        preferParts.push("return=representation");
      } else if (this.method === "POST" || this.method === "PATCH" || this.method === "DELETE") {
        preferParts.push("return=minimal");
      }

      if (this.upsertOptions) {
        preferParts.push(
          this.upsertOptions.ignoreDuplicates
            ? "resolution=ignore-duplicates"
            : "resolution=merge-duplicates"
        );
      }

      if (this.countMode === "exact") {
        preferParts.push("count=exact");
      }

      const headers: Record<string, string> = {
        apikey: this.apiKey,
        Authorization: `Bearer ${this.bearerToken}`,
      };

      if (preferParts.length > 0) {
        headers["Prefer"] = preferParts.join(",");
      }

      if (this.bodyPayload !== undefined) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(endpoint, {
        method: this.headOnly ? "HEAD" : this.method,
        headers,
        body: this.bodyPayload !== undefined ? JSON.stringify(this.bodyPayload) : undefined,
        cache: "no-store",
      });

      let count: number | null = null;
      const contentRange = res.headers.get("content-range");
      if (contentRange) {
        const parts = contentRange.split("/");
        if (parts.length === 2 && parts[1] !== "*") {
          const parsedCount = parseInt(parts[1], 10);
          if (!isNaN(parsedCount)) count = parsedCount;
        }
      }

      if (this.headOnly) {
        if (!res.ok) {
          return {
            data: null,
            error: { message: `HTTP ${res.status}`, status: res.status },
            count: null,
          };
        }
        return { data: null, error: null, count };
      }

      const text = await res.text();
      let parsed: any = null;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }

      if (!res.ok) {
        return {
          data: null,
          error: {
            message: parsed?.message || parsed?.error || parsed?.hint || `HTTP ${res.status}`,
            details: parsed?.details || null,
            code: parsed?.code || String(res.status),
          },
          count,
        };
      }

      if (this.isSingle) {
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            return {
              data: null,
              error: { message: "Row not found", code: "PGRST116" },
              count,
            };
          }
          return { data: parsed[0], error: null, count };
        }
        return { data: parsed, error: null, count };
      }

      if (this.isMaybeSingle) {
        if (Array.isArray(parsed)) {
          return { data: parsed.length > 0 ? parsed[0] : null, error: null, count };
        }
        return { data: parsed ?? null, error: null, count };
      }

      return { data: parsed, error: null, count };
    } catch (err: any) {
      return {
        data: null,
        error: { message: err?.message || "Network request to Supabase failed" },
        count: null,
      };
    }
  }

  then<TResult1 = { data: any; error: any; count: number | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: any; count: number | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export interface SupabaseClient {
  from: (table: string) => PostgrestQueryBuilder;
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{
      data: { user: any; session: any };
      error: { message: string; status?: number } | null;
    }>;
    signOut: () => Promise<{ error: any }>;
    getUser: (jwt?: string) => Promise<{
      data: { user: any };
      error: { message: string; status?: number } | null;
    }>;
    resetPasswordForEmail: (
      email: string,
      options?: { redirectTo?: string }
    ) => Promise<{ data: any; error: { message: string } | null }>;
    updateUser: (attributes: {
      password?: string;
      email?: string;
      data?: any;
    }) => Promise<{ data: { user: any }; error: { message: string } | null }>;
    admin: {
      listUsers: (params?: { page?: number; perPage?: number }) => Promise<{
        data: { users: any[] };
        error: { message: string } | null;
      }>;
      createUser: (attributes: any) => Promise<{
        data: { user: any };
        error: { message: string } | null;
      }>;
      updateUserById: (
        uid: string,
        attributes: any
      ) => Promise<{
        data: { user: any };
        error: { message: string } | null;
      }>;
    };
  };
}

function buildSupabaseClient(url: string, apiKey: string, accessToken?: string): SupabaseClient {
  const baseUrl = url.replace(/\/+$/, "");
  const bearer = accessToken || apiKey;

  return {
    from(table: string) {
      return new PostgrestQueryBuilder(baseUrl, apiKey, bearer, table);
    },
    auth: {
      async signInWithPassword({ email, password }) {
        try {
          const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: {
              apikey: apiKey,
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
            cache: "no-store",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.access_token) {
            return {
              data: { user: null, session: null },
              error: {
                message:
                  data?.msg ||
                  data?.error_description ||
                  data?.message ||
                  "Invalid email or password",
                status: res.status,
              },
            };
          }
          return {
            data: {
              user: data.user,
              session: {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in,
                token_type: data.token_type || "bearer",
                user: data.user,
              },
            },
            error: null,
          };
        } catch (err: any) {
          return {
            data: { user: null, session: null },
            error: { message: err?.message || "Authentication service unavailable" },
          };
        }
      },

      async signOut() {
        try {
          await fetch(`${baseUrl}/auth/v1/logout`, {
            method: "POST",
            headers: {
              apikey: apiKey,
              Authorization: `Bearer ${bearer}`,
            },
            cache: "no-store",
          });
          return { error: null };
        } catch (err: any) {
          return { error: { message: err?.message || "Sign out error" } };
        }
      },

      async getUser(jwt?: string) {
        try {
          const token = jwt || bearer;
          const res = await fetch(`${baseUrl}/auth/v1/user`, {
            method: "GET",
            headers: {
              apikey: apiKey,
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.id) {
            return {
              data: { user: null },
              error: {
                message: data?.msg || data?.message || "Invalid or expired session",
                status: res.status,
              },
            };
          }
          return { data: { user: data }, error: null };
        } catch (err: any) {
          return {
            data: { user: null },
            error: { message: err?.message || "Unable to verify user session" },
          };
        }
      },

      async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
        try {
          const qs = options?.redirectTo
            ? `?redirect_to=${encodeURIComponent(options.redirectTo)}`
            : "";
          const res = await fetch(`${baseUrl}/auth/v1/recover${qs}`, {
            method: "POST",
            headers: {
              apikey: apiKey,
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
            cache: "no-store",
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return {
              data: null,
              error: {
                message: data?.msg || data?.message || "Unable to send password recovery email",
              },
            };
          }
          return { data: {}, error: null };
        } catch (err: any) {
          return {
            data: null,
            error: { message: err?.message || "Password recovery request failed" },
          };
        }
      },

      async updateUser(attributes) {
        try {
          const res = await fetch(`${baseUrl}/auth/v1/user`, {
            method: "PUT",
            headers: {
              apikey: apiKey,
              Authorization: `Bearer ${bearer}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(attributes),
            cache: "no-store",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            return {
              data: { user: null },
              error: {
                message: data?.msg || data?.message || "Failed to update user",
              },
            };
          }
          return { data: { user: data }, error: null };
        } catch (err: any) {
          return {
            data: { user: null },
            error: { message: err?.message || "Failed to update user" },
          };
        }
      },

      admin: {
        async listUsers(params) {
          try {
            const perPage = params?.perPage || 100;
            const page = params?.page || 1;
            const res = await fetch(
              `${baseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
              {
                method: "GET",
                headers: {
                  apikey: apiKey,
                  Authorization: `Bearer ${apiKey}`,
                },
                cache: "no-store",
              }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              return {
                data: { users: [] },
                error: { message: data?.msg || data?.message || "Failed to list Auth users" },
              };
            }
            return { data: { users: data?.users || [] }, error: null };
          } catch (err: any) {
            return {
              data: { users: [] },
              error: { message: err?.message || "Failed to list Auth users" },
            };
          }
        },

        async createUser(attributes) {
          try {
            const res = await fetch(`${baseUrl}/auth/v1/admin/users`, {
              method: "POST",
              headers: {
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(attributes),
              cache: "no-store",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              return {
                data: { user: null },
                error: { message: data?.msg || data?.message || "Failed to create Auth user" },
              };
            }
            return { data: { user: data }, error: null };
          } catch (err: any) {
            return {
              data: { user: null },
              error: { message: err?.message || "Failed to create Auth user" },
            };
          }
        },

        async updateUserById(uid, attributes) {
          try {
            const res = await fetch(`${baseUrl}/auth/v1/admin/users/${encodeURIComponent(uid)}`, {
              method: "PUT",
              headers: {
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(attributes),
              cache: "no-store",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              return {
                data: { user: null },
                error: { message: data?.msg || data?.message || "Failed to update Auth user" },
              };
            }
            return { data: { user: data }, error: null };
          } catch (err: any) {
            return {
              data: { user: null },
              error: { message: err?.message || "Failed to update Auth user" },
            };
          }
        },
      },
    },
  };
}

let cachedServiceClient: SupabaseClient | null = null;
let cachedAnonClient: SupabaseClient | null = null;

/**
 * Creates a fresh, non-persisting Supabase client for Auth operations
 * (signInWithPassword, getUser, resetPasswordForEmail, updateUser, signOut).
 */
export function createSupabaseAuthClient(accessToken?: string): SupabaseClient {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  return buildSupabaseClient(url, anonKey, accessToken);
}

/**
 * Returns the server-side Supabase client for database queries.
 * - If SUPABASE_SERVICE_ROLE_KEY is set in server environment variables, uses it on the server.
 * - Otherwise, if an authenticated user's Supabase access token is present in cookies (or passed in),
 *   attaches it as the Authorization Bearer token so RLS `authenticated` policies are satisfied.
 */
export function getSupabaseClient(accessToken?: string): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (serviceKey) {
    if (!cachedServiceClient) {
      cachedServiceClient = buildSupabaseClient(url, serviceKey);
    }
    return cachedServiceClient;
  }

  let token = accessToken;
  if (!token) {
    try {
      const { cookies } = require("next/headers");
      const cookieStore = cookies();
      token = cookieStore.get("sb-access-token")?.value;
    } catch {
      // Called outside Next.js request context
    }
  }

  if (token) {
    return createSupabaseAuthClient(token);
  }

  if (!cachedAnonClient) {
    cachedAnonClient = createSupabaseAuthClient();
  }
  return cachedAnonClient;
}

/**
 * Returns a privileged Supabase Admin client strictly on the server if SUPABASE_SERVICE_ROLE_KEY is configured.
 * Returns null if SUPABASE_SERVICE_ROLE_KEY is not present in server environment variables.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const serviceKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!serviceKey) return null as unknown as SupabaseClient;
  if (!cachedServiceClient) {
    cachedServiceClient = buildSupabaseClient(getSupabaseUrl(), serviceKey);
  }
  return cachedServiceClient;
}

export const getSupabase = getSupabaseClient;
export const getSupabaseAdmin = getSupabaseAdminClient;
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

