import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Max AI generations per rolling 24h across ALL demo visitors combined. */
export function demoDailyAiLimit(): number {
  const n = Number(process.env.AI_DEMO_DAILY_LIMIT);
  return Number.isInteger(n) && n >= 0 ? n : 20;
}

/**
 * Returns the auth user that owns the business flagged `is_demo`, or null if
 * the demo has not been set up (`npm run db:seed`).
 *
 * The user is resolved through the business, not by email: the demo account
 * is shared, so a visitor could change its email or password through the Auth
 * API. If the email no longer matches DEMO_USER_EMAIL it is restored here.
 */
export async function getDemoUser(admin: SupabaseClient): Promise<User | null> {
  const { data: business, error } = await admin
    .from("businesses")
    .select("user_id")
    .eq("is_demo", true)
    .maybeSingle();
  if (error) throw error;
  if (!business) return null;

  const { data, error: userError } = await admin.auth.admin.getUserById(business.user_id);
  if (userError) throw userError;

  const expectedEmail = process.env.DEMO_USER_EMAIL?.toLowerCase();
  if (expectedEmail && data.user.email?.toLowerCase() !== expectedEmail) {
    const { data: fixed, error: fixError } = await admin.auth.admin.updateUserById(data.user.id, {
      email: expectedEmail,
      email_confirm: true,
    });
    if (fixError) throw fixError;
    return fixed.user;
  }
  return data.user;
}
