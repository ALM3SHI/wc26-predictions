import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import webpush from "web-push";

// ─────────────────────────────────────────────────────────────
// POST /api/admin/broadcast
// Sends a Web Push notification to every profile with a saved
// subscription. Gated by is_admin and rate-limited by natural
// caller flow (one form submit = one broadcast).
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "dummy_public_key";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "dummy_private_key";

export async function POST(req: Request) {
  // Gate: caller must be an authenticated admin.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    body?: string;
    url?: string;
  } | null;
  if (!body?.title || !body?.body) {
    return NextResponse.json({ message: "Missing title or body" }, { status: 400 });
  }

  // Bypass RLS by using the service-role key here — we need to hit
  // every subscription, and profiles are otherwise RLS'd per-user.
  const service = createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: subs } = await service
    .from("profiles")
    .select("id, push_subscription")
    .not("push_subscription", "is", null);

  webpush.setVapidDetails(
    "mailto:wc26predictions@example.com",
    VAPID_PUBLIC,
    VAPID_PRIVATE,
  );

  const payload = JSON.stringify({
    title: body.title,
    body: body.body,
    url: body.url || "/",
  });

  let delivered = 0;
  let stale = 0;
  const promises: Promise<unknown>[] = [];
  for (const row of subs ?? []) {
    const sub = (row as { id: string; push_subscription: unknown })
      .push_subscription;
    if (!sub) continue;
    promises.push(
      webpush
        .sendNotification(
          sub as webpush.PushSubscription,
          payload,
        )
        .then(() => {
          delivered += 1;
        })
        .catch(async (err) => {
          // 404 / 410 → subscription is gone, clear it out so we
          // don't keep trying next time.
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            stale += 1;
            const uid = (row as { id: string }).id;
            await service
              .from("profiles")
              .update({ push_subscription: null })
              .eq("id", uid);
          }
        }),
    );
  }
  await Promise.allSettled(promises);

  return NextResponse.json({ delivered, stale });
}
