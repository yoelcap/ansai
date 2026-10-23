/**
 * Creates (if needed) and resets the public demo account.
 *
 *   npm run db:seed          # uses .env.local
 *
 * Safe to run against production: it only ever writes to the auth user named
 * by DEMO_USER_EMAIL and the single business flagged `is_demo`. The data itself
 * comes from the SQL function public.reset_demo_data() (migration 0004), which
 * refuses to run on any business that is not the demo one.
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *               DEMO_USER_EMAIL, DEMO_USER_PASSWORD
 */
import { createClient, type User } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (CI): variables come from the environment.
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing environment variable ${name}`);
    process.exit(1);
  }
  return value;
}

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const demoEmail = requireEnv("DEMO_USER_EMAIL").toLowerCase();
const demoPassword = requireEnv("DEMO_USER_PASSWORD");

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email: string): Promise<User | null> {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
}

async function ensureDemoUser(): Promise<User> {
  // The demo account is shared, so a visitor may have changed its email or
  // password through the Auth API. Resolve it through the demo business first
  // and restore both credentials.
  const { data: flagged, error: flaggedError } = await admin
    .from("businesses")
    .select("user_id")
    .eq("is_demo", true)
    .maybeSingle();
  if (flaggedError) throw flaggedError;

  const existing = flagged
    ? (await admin.auth.admin.getUserById(flagged.user_id)).data.user
    : await findUserByEmail(demoEmail);

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: demoEmail,
    password: demoPassword,
    email_confirm: true,
    user_metadata: { full_name: "Demo" },
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  console.log(`Created demo user ${demoEmail}`);
  return data.user;
}

async function ensureDemoBusiness(userId: string): Promise<string> {
  const { data: flagged, error: flaggedError } = await admin
    .from("businesses")
    .select("id, user_id")
    .eq("is_demo", true)
    .maybeSingle();
  if (flaggedError) throw flaggedError;

  if (flagged) {
    if (flagged.user_id !== userId) {
      throw new Error(
        `The demo business ${flagged.id} belongs to another user. Refusing to continue.`
      );
    }
    return flagged.id as string;
  }

  const { data: owned, error: ownedError } = await admin
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ownedError) throw ownedError;

  if (owned) {
    const { error } = await admin.from("businesses").update({ is_demo: true }).eq("id", owned.id);
    if (error) throw error;
    return owned.id as string;
  }

  const { data: created, error: createError } = await admin
    .from("businesses")
    .insert({
      user_id: userId,
      name: "Taberna El Faro",
      type: "restaurant",
      city: "Mechelen",
      country: "BE",
      is_demo: true,
    })
    .select("id")
    .single();
  if (createError || !created) throw createError ?? new Error("insert returned no row");
  console.log("Created demo business");
  return created.id as string;
}

async function main() {
  const user = await ensureDemoUser();
  const businessId = await ensureDemoBusiness(user.id);

  const { error } = await admin.rpc("reset_demo_data", { p_business_id: businessId });
  if (error) throw error;

  const { count } = await admin
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  console.log(`Demo reset OK: business ${businessId}, ${count ?? "?"} reviews.`);
}

main().catch((err) => {
  console.error("Demo reset failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
