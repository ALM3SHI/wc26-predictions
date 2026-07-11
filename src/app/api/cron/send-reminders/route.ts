import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { Resend } from "resend";
import webpush from "web-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

// Configure web-push is deferred to runtime in the handler

const resend = new Resend(RESEND_API_KEY || "re_dummy");

/**
 * CRON: Send Pre-Match Reminders
 * Triggered by QStash every 15 minutes.
 *
 * Finds matches starting within the next 60–75 minutes,
 * then notifies users who haven't submitted predictions yet.
 */
async function handler(req: Request) {
  const startTime = Date.now();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Configure web-push with fallbacks for build-time safety
    webpush.setVapidDetails(
      "mailto:wc26predictions@example.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "dummy_public_key",
      process.env.VAPID_PRIVATE_KEY || "dummy_private_key"
    );

    // Find matches starting in the next 60-75 minutes
    const now = new Date();
    const in60min = new Date(now.getTime() + 60 * 60 * 1000);
    const in75min = new Date(now.getTime() + 75 * 60 * 1000);

    const { data: upcomingMatches, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "NS")
      .gte("start_time", in60min.toISOString())
      .lte("start_time", in75min.toISOString());

    if (matchError) {
      console.error("Error fetching upcoming matches:", matchError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!upcomingMatches || upcomingMatches.length === 0) {
      return NextResponse.json({
        message: "No matches starting in the reminder window",
        duration: Date.now() - startTime,
      });
    }

    let emailsSent = 0;
    let pushSent = 0;
    let errors = 0;

    for (const match of upcomingMatches) {
      // Get users who haven't predicted this match
      const { data: users, error: usersError } = await supabase.rpc(
        "get_users_without_predictions",
        { p_match_id: match.id }
      );

      if (usersError) {
        console.error("Error getting users without predictions:", usersError);
        errors++;
        continue;
      }

      if (!users || users.length === 0) continue;

      const matchTime = new Date(match.start_time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });

      for (const user of users) {
        const title = "⚽ Don't forget to predict!";
        const body = `${match.home_team} vs ${match.away_team} kicks off at ${matchTime}. Submit your prediction now!`;

        // Send Push Notification
        if (user.push_subscription) {
          try {
            await webpush.sendNotification(
              user.push_subscription,
              JSON.stringify({
                title,
                body,
                url: `/match/${match.id}`,
              })
            );
            pushSent++;
          } catch (pushError: unknown) {
            // If subscription is expired/invalid, remove it
            if (
              pushError instanceof Error &&
              "statusCode" in pushError &&
              ((pushError as { statusCode: number }).statusCode === 404 ||
                (pushError as { statusCode: number }).statusCode === 410)
            ) {
              await supabase
                .from("profiles")
                .update({ push_subscription: null })
                .eq("id", user.user_id);
            }
            console.error("Push error for user", user.user_id, pushError);
          }
        }

        // Send Email Notification
        if (user.email) {
          try {
            await resend.emails.send({
              from: "WC26 Predictions <onboarding@resend.dev>",
              to: user.email,
              subject: `⚽ ${match.home_team} vs ${match.away_team} — Lock your pick!`,
              html: `
                <div style="background-color: #F9FAFB; color: #111827; padding: 24px; font-family: 'Inter', Arial, sans-serif;">
                  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.06);">
                    <div style="height: 8px; background: linear-gradient(90deg, #C8102E 0%, #C8102E 33%, #002868 33%, #002868 66%, #006847 66%, #006847 100%);"></div>
                    <div style="padding: 32px; text-align: center;">
                      <div style="display: inline-block; background: #002868; color: white; width: 56px; height: 56px; border-radius: 50%; line-height: 56px; font-weight: 900; font-size: 22px; margin-bottom: 16px;">26</div>
                      <p style="font-size: 12px; color: #C8102E; text-transform: uppercase; letter-spacing: 3px; font-weight: 800; margin: 0 0 8px 0;">
                        ⏰ Kickoff in ~1 hour
                      </p>
                      <h2 style="font-size: 28px; font-weight: 900; margin: 0 0 8px 0; color: #111827; text-transform: uppercase;">
                        ${match.home_team} <span style="color: #C8102E;">vs</span> ${match.away_team}
                      </h2>
                      <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 14px;">
                        ${matchTime}${match.venue ? ` • ${match.venue}` : ""}
                      </p>
                      <p style="color: #6B7280; margin: 0 0 24px 0; font-size: 13px;">
                        Round: <strong style="color: #002868;">${match.round}</strong>
                      </p>
                      <div style="padding: 16px; border: 1.5px dashed #C8102E; border-radius: 12px; background: rgba(200,16,46,0.04); margin-bottom: 24px;">
                        <p style="color: #C8102E; font-weight: 700; margin: 0; font-size: 15px;">
                          You haven't picked yet. Stake a chip while you still can.
                        </p>
                      </div>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wc26-predictions.vercel.app"}/match/${match.id}"
                         style="display: inline-block; background: linear-gradient(135deg, #C8102E 0%, #002868 100%); color: #ffffff; padding: 16px 40px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 16px; letter-spacing: 1px;">
                        LOCK IN MY PICK →
                      </a>
                      <p style="color: #9CA3AF; font-size: 11px; margin: 24px 0 0 0;">
                        WC26 · USA · Canada · Mexico
                      </p>
                    </div>
                  </div>
                  <p style="text-align: center; color: #9CA3AF; font-size: 11px; margin-top: 16px;">
                    You're receiving this because email reminders are on. <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wc26-predictions.vercel.app"}/settings" style="color: #002868;">Manage in settings</a>
                  </p>
                </div>
              `,
            });
            emailsSent++;
          } catch (emailError) {
            console.error("Email error for user", user.user_id, emailError);
            errors++;
          }
        }
      }
    }

    return NextResponse.json({
      message: "Reminders sent",
      matches: upcomingMatches.length,
      emailsSent,
      pushSent,
      errors,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error("Cron send-reminders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Wrap with QStash signature verification
export const POST = verifySignatureAppRouter(handler, {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "dummy_current_key",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "dummy_next_key",
});
