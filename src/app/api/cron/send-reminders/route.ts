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
              subject: `⚽ ${match.home_team} vs ${match.away_team} — Predict Now!`,
              html: `
                <div style="background-color: #0A0A0F; color: #ffffff; padding: 40px; font-family: 'Inter', Arial, sans-serif; border-radius: 16px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="font-size: 28px; font-weight: 800; margin: 0; background: linear-gradient(135deg, #8B5CF6, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                      WC26 PREDICTIONS
                    </h1>
                  </div>
                  <div style="background: rgba(26,26,46,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; text-align: center;">
                    <p style="font-size: 14px; color: #A78BFA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px;">
                      ⏰ Starting in ~1 hour
                    </p>
                    <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                      ${match.home_team} vs ${match.away_team}
                    </h2>
                    <p style="color: #9CA3AF; margin-bottom: 24px;">
                      ${matchTime}${match.venue ? ` • ${match.venue}` : ""}
                    </p>
                    <p style="color: #F87171; font-weight: 600; margin-bottom: 24px;">
                      You haven't submitted a prediction yet!
                    </p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wc26-predictions.vercel.app"}/match/${match.id}"
                       style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">
                      Make Your Prediction →
                    </a>
                  </div>
                  <p style="text-align: center; color: #6B7280; font-size: 12px; margin-top: 24px;">
                    You're receiving this because you enabled email notifications.
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
