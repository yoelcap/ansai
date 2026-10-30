/**
 * Cross-tenant RLS check against a real Supabase project, through the public
 * REST API (PostgREST) with the anon key, exactly as a browser would call it.
 *
 *   npm run test:rls                 # two-user isolation + anon checks
 *   npm run test:rls -- --demo       # also the demo-account write lock (0006)
 *
 * Creates two temporary users (A and B) with a business, a review, a
 * response, a tone config and a team member each, then checks that A cannot
 * read, update, delete or insert anything belonging to B in any table, and
 * that an anonymous client cannot read anything. Everything it creates is
 * deleted at the end (also on failure). Requires NEXT_PUBLIC_SUPABASE_URL,
 * NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI: variables come from the environment.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !anonKey || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const opts = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, serviceKey, opts);
const checkDemo = process.argv.includes("--demo");

let passed = 0;
let failed = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}

/** Signs in as `email` without a password or CAPTCHA (admin magic-link token). */
async function sessionFor(email: string): Promise<SupabaseClient> {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) throw error ?? new Error("no token");
  const client = createClient(url, anonKey, opts);
  const { error: otpError } = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: data.properties.hashed_token,
  });
  if (otpError) throw otpError;
  return client;
}

interface Tenant {
  userId: string;
  email: string;
  businessId: string;
  reviewId: string;
  responseId: string;
  teamMemberId: string;
}

async function createTenant(tag: string): Promise<Tenant> {
  const email = `rls-${tag}-${Date.now()}@example.com`;
  const { data: u, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error || !u.user) throw error ?? new Error("createUser");
  const userId = u.user.id;

  const one = async <T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<NonNullable<T>> => {
    const { data, error: e } = await p;
    if (e || !data) throw e ?? new Error("insert returned nothing");
    return data;
  };
  const biz = await one(admin.from("businesses").insert({ user_id: userId, name: `RLS ${tag}`, type: "bar" }).select("id").single());
  const rev = await one(admin.from("reviews").insert({ business_id: biz.id, customer_name: `C ${tag}`, rating: 4, text: `Review of ${tag}` }).select("id").single());
  const resp = await one(admin.from("responses").insert({ review_id: rev.id, text: `Reply ${tag}` }).select("id").single());
  await one(admin.from("tone_configs").insert({ business_id: biz.id, signature: `Sig ${tag}` }).select("id").single());
  const tm = await one(admin.from("team_members").insert({ business_id: biz.id, email: `team-${tag}@example.com` }).select("id").single());
  await one(admin.from("integrations").insert({ business_id: biz.id, provider: "google", access_token: `secret-${tag}` }).select("id").single());
  await one(admin.from("daily_metrics").insert({ business_id: biz.id, date: "2026-01-01" }).select("id").single());

  return { userId, email, businessId: biz.id, reviewId: rev.id, responseId: resp.id, teamMemberId: tm.id };
}

/** Rows A can see / change of B, by table and the column that scopes them to B. */
function targets(b: Tenant) {
  return [
    { table: "businesses", col: "id", val: b.businessId, update: { name: "pwned" } },
    { table: "profiles", col: "id", val: b.userId, update: { full_name: "pwned" } },
    { table: "reviews", col: "business_id", val: b.businessId, update: { text: "pwned" } },
    { table: "responses", col: "review_id", val: b.reviewId, update: { text: "pwned" } },
    { table: "tone_configs", col: "business_id", val: b.businessId, update: { signature: "pwned" } },
    { table: "team_members", col: "business_id", val: b.businessId, update: { role: "admin" } },
    { table: "integrations", col: "business_id", val: b.businessId, update: { status: "connected" } },
    { table: "daily_metrics", col: "business_id", val: b.businessId, update: { total_reviews: 999 } },
    { table: "ai_generations", col: "business_id", val: b.businessId, update: { is_demo: true } },
  ] as const;
}

async function crossTenantChecks(a: SupabaseClient, b: Tenant) {
  console.log("\n— A against B's data —");
  for (const t of targets(b)) {
    const sel = await a.from(t.table).select("*").eq(t.col, t.val);
    check(`${t.table}: A cannot read B`, !!sel.error || sel.data?.length === 0, sel.error?.message ?? `${sel.data?.length} rows`);

    const upd = await a.from(t.table).update(t.update).eq(t.col, t.val).select();
    check(`${t.table}: A cannot update B`, !!upd.error || upd.data?.length === 0, upd.error?.message ?? `${upd.data?.length} rows`);

    const del = await a.from(t.table).delete().eq(t.col, t.val).select();
    check(`${t.table}: A cannot delete B`, !!del.error || del.data?.length === 0, del.error?.message ?? `${del.data?.length} rows`);
  }

  // Inserts that point at B's business / review must be rejected.
  const inserts: [string, Record<string, unknown>][] = [
    ["reviews", { business_id: b.businessId, customer_name: "x", rating: 5, text: "injected" }],
    ["responses", { review_id: b.reviewId, text: "injected" }],
    ["tone_configs", { business_id: b.businessId }],
    ["team_members", { business_id: b.businessId, email: "evil@example.com" }],
    ["integrations", { business_id: b.businessId, provider: "facebook" }],
    ["businesses", { user_id: b.userId, name: "owned by B?", type: "bar" }],
  ];
  for (const [table, row] of inserts) {
    const ins = await a.from(table).insert(row).select();
    check(`${table}: A cannot insert into B`, !!ins.error, ins.error?.message ?? "INSERTED");
  }

  // Moving A's own review into B's business must be rejected (WITH CHECK).
  const { data: aReview } = await a.from("reviews").select("id").limit(1).single();
  const move = await a.from("reviews").update({ business_id: b.businessId }).eq("id", aReview!.id).select();
  check("reviews: A cannot move its own row into B", !!move.error, move.error?.message ?? "MOVED");

  // Server-only functions.
  for (const fn of ["reset_demo_data", "claim_ai_generation", "handle_new_user"]) {
    const args = fn === "reset_demo_data" ? { p_business_id: b.businessId }
      : fn === "claim_ai_generation" ? { p_user_id: b.userId, p_business_id: b.businessId } : {};
    const rpc = await a.rpc(fn, args);
    check(`rpc ${fn}: denied to users`, !!rpc.error, rpc.error?.message ?? "ALLOWED");
  }

  // integrations: `select *` is denied by the column grants, which would hide
  // whether RLS filters rows. Check again with the columns browsers may read.
  const safe = await a.from("integrations").select("id, business_id, provider, status").eq("business_id", b.businessId);
  check("integrations (granted columns): A cannot read B", !safe.error && safe.data?.length === 0, safe.error?.message ?? `${safe.data?.length} rows`);
  const ownSafe = await a.from("integrations").select("id, provider, status");
  check("integrations (granted columns): A reads its own", !ownSafe.error && ownSafe.data?.length === 1, ownSafe.error?.message ?? `${ownSafe.data?.length} rows`);

  // OAuth tokens are not readable even for the owner.
  const own = await a.from("integrations").select("access_token");
  check("integrations.access_token: hidden from its own owner", !!own.error, own.error?.message ?? "READABLE");
}

async function anonChecks(b: Tenant) {
  console.log("\n— Anonymous client (anon key, no session) —");
  const anon = createClient(url, anonKey, opts);
  for (const t of targets(b)) {
    const sel = await anon.from(t.table).select("*").eq(t.col, t.val);
    check(`${t.table}: anon cannot read`, !!sel.error || sel.data?.length === 0, sel.error?.message ?? `${sel.data?.length} rows`);
  }
  const ins = await anon.from("reviews").insert({ business_id: b.businessId, customer_name: "x", rating: 1, text: "anon" });
  check("reviews: anon cannot insert", !!ins.error, ins.error?.message ?? "INSERTED");
}

async function demoChecks() {
  console.log("\n— Demo account write lock (migration 0006) —");
  const { data: biz } = await admin.from("businesses").select("id, user_id, name").eq("is_demo", true).single();
  if (!biz) return check("demo business exists", false);
  const { data: owner } = await admin.auth.admin.getUserById(biz.user_id);
  const demo = await sessionFor(owner.user!.email!);

  const rename = await demo.from("businesses").update({ name: "Offensive" }).eq("id", biz.id).select();
  check("demo cannot rename its business", !!rename.error || rename.data?.length === 0);
  const tone = await demo.from("tone_configs").update({ signature: "Offensive" }).eq("business_id", biz.id).select();
  check("demo cannot change the tone config", !!tone.error || tone.data?.length === 0);
  const prof = await demo.from("profiles").update({ full_name: "Offensive" }).eq("id", biz.user_id).select();
  check("demo cannot change its profile", !!prof.error || prof.data?.length === 0);
  const team = await demo.from("team_members").insert({ business_id: biz.id, email: "x@example.com" });
  check("demo cannot add team members", !!team.error);
  const reviews = await demo.from("reviews").select("id").eq("business_id", biz.id).limit(1);
  check("demo can still read its reviews", !reviews.error && (reviews.data?.length ?? 0) > 0);
  const { data: after } = await admin.from("businesses").select("name").eq("id", biz.id).single();
  check("demo business name unchanged", after?.name === biz.name, after?.name);
}

async function main() {
  const created: Tenant[] = [];
  try {
    const a = await createTenant("a");
    created.push(a);
    const b = await createTenant("b");
    created.push(b);

    const clientA = await sessionFor(a.email);
    const whoami = await clientA.from("businesses").select("id");
    check("A sees exactly its own business", whoami.data?.length === 1 && whoami.data[0].id === a.businessId);

    await crossTenantChecks(clientA, b);
    await anonChecks(b);
    if (checkDemo) await demoChecks();

    // B's data must be untouched after all of the above.
    const { data: bReview } = await admin.from("reviews").select("text, business_id").eq("id", b.reviewId).single();
    const { data: bBiz } = await admin.from("businesses").select("name").eq("id", b.businessId).single();
    check("B's data intact afterwards", bReview?.text === "Review of b" && bReview?.business_id === b.businessId && bBiz?.name === "RLS b");
  } finally {
    for (const t of created) {
      // Cascades to businesses, reviews, responses, tone, team, integrations, metrics.
      const { error } = await admin.auth.admin.deleteUser(t.userId);
      if (error) console.error(`cleanup failed for ${t.email}:`, error.message);
    }
    console.log(`\n${passed} passed, ${failed} failed · cleaned up ${created.length} temporary users`);
  }
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("RLS check crashed:", err);
  process.exit(1);
});
