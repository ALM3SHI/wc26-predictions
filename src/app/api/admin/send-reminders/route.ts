import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import webpush from "web-push";

/**
 * Admin-triggerable reminder — fires the same pre-kickoff nudge the
 * cron sends, but on demand. Useful for testing the delivery pipeline
 * and for pushing an urgent notification without waiting for the cron.
 *
 * POST body: { matchId?: string, windowMinutes?: number }
 *   - matchId: send only for this match (bypasses the time window)
 *   - windowMinutes: how far ahead to look (default 90)
 *
 * Requires admin auth via Bearer token (same pattern as other /admin routes).
 */
export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const RESEND_API_KEY = process.env.RESEND_API_KEY!;

    if (!SUPABASE_SERVICE_KEY) throw new Error("Missing service role key");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid token");

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      matchId?: string;
      windowMinutes?: number;
    };

    const resend = new Resend(RESEND_API_KEY || "re_dummy");
    webpush.setVapidDetails(
      "mailto:wc26predictions@example.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "dummy_public_key",
      process.env.VAPID_PRIVATE_KEY || "dummy_private_key",
    );

    let query = supabase.from("matches").select("*").eq("status", "NS");
    if (body.matchId) {
      query = query.eq("id", body.matchId);
    } else {
      const now = new Date();
      const upper = new Date(
        now.getTime() + (body.windowMinutes ?? 90) * 60 * 1000,
      );
      query = query
        .gte("start_time", now.toISOString())
        .lte("start_time", upper.toISOString());
    }

    const { data: matches, error: matchError } = await query;
    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 500 });
    }
    if (!matches || matches.length === 0) {
      return NextResponse.json({
        message: "No matches in window",
        duration: Date.now() - startTime,
      });
    }

    let emailsSent = 0;
    let pushSent = 0;
    let errors = 0;

    for (const match of matches) {
      const { data: users, error: usersError } = await supabase.rpc(
        "get_users_without_predictions",
        { p_match_id: match.id },
      );
      if (usersError) {
        errors++;
        continue;
      }
      if (!users || users.length === 0) continue;

      const matchTime = new Date(match.start_time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });

      for (const u of users as Array<{
        user_id: string;
        email: string | null;
        push_subscription: unknown;
      }>) {
        const title = "⚽ Lock your pick!";
        const bodyText = `${match.home_team} vs ${match.away_team} at ${matchTime}. Predict now!`;

        if (u.push_subscription) {
          try {
            await webpush.sendNotification(
              u.push_subscription as webpush.PushSubscription,
              JSON.stringify({ title, body: bodyText, url: `/match/${match.id}` }),
            );
            pushSent++;
          } catch (pushError: unknown) {
            if (
              pushError instanceof Error &&
              "statusCode" in pushError &&
              ((pushError as { statusCode: number }).statusCode === 404 ||
                (pushError as { statusCode: number }).statusCode === 410)
            ) {
              await supabase
                .from("profiles")
                .update({ push_subscription: null })
                .eq("id", u.user_id);
            }
            errors++;
          }
        }

        if (u.email) {
          try {
            await resend.emails.send({
              from: "WC26 Predictions <onboarding@resend.dev>",
              to: u.email,
              subject: `⚽ ${match.home_team} vs ${match.away_team} — Lock your pick!`,
              html: reminderEmail(match, matchTime),
            });
            emailsSent++;
          } catch {
            errors++;
          }
        }
      }
    }

    return NextResponse.json({
      message: "Reminders dispatched",
      matches: matches.length,
      emailsSent,
      pushSent,
      errors,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

interface MatchLite {
  id: string;
  home_team: string;
  away_team: string;
  venue: string | null;
  round: string;
}

function reminderEmail(match: MatchLite, matchTime: string): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://wc26-predictions.vercel.app";
  return `
    <div style="background-color: #F9FAFB; color: #111827; padding: 24px; font-family: 'Inter', Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.06);">
        <div style="height: 8px; background: linear-gradient(90deg, #C8102E 0%, #C8102E 33%, #002868 33%, #002868 66%, #006847 66%, #006847 100%);"></div>
        <div style="padding: 32px; text-align: center;">
          <div style="display: inline-block; background: #002868; color: white; width: 56px; height: 56px; border-radius: 50%; line-height: 56px; font-weight: 900; font-size: 22px; margin-bottom: 16px;">26</div>
          <p style="font-size: 12px; color: #C8102E; text-transform: uppercase; letter-spacing: 3px; font-weight: 800; margin: 0 0 8px 0;">
            ⏰ Kickoff soon
          </p>
          <h2 style="font-size: 28px; font-weight: 900; margin: 0 0 8px 0; color: #111827; text-transform: uppercase;">
            ${match.home_team} <span style="color: #C8102E;">vs</span> ${match.away_team}
          </h2>
          <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 14px;">${matchTime}${match.venue ? ` • ${match.venue}` : ""}</p>
          <p style="color: #6B7280; margin: 0 0 24px 0; font-size: 13px;">Round: <strong style="color: #002868;">${match.round}</strong></p>
          <div style="padding: 16px; border: 1.5px dashed #C8102E; border-radius: 12px; background: rgba(200,16,46,0.04); margin-bottom: 24px;">
            <p style="color: #C8102E; font-weight: 700; margin: 0; font-size: 15px;">You haven't picked yet. Stake a chip while you still can.</p>
          </div>
          <a href="${appUrl}/match/${match.id}" style="display: inline-block; background: linear-gradient(135deg, #C8102E 0%, #002868 100%); color: #ffffff; padding: 16px 40px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 16px; letter-spacing: 1px;">LOCK IN MY PICK →</a>
          <p style="color: #9CA3AF; font-size: 11px; margin: 24px 0 0 0;">WC26 · USA · Canada · Mexico</p>
        </div>
      </div>
      <p style="text-align: center; color: #9CA3AF; font-size: 11px; margin-top: 16px;">Manage email preferences in <a href="${appUrl}/settings" style="color: #002868;">Settings</a>.</p>
    </div>
  `;
}
