import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!SUPABASE_SERVICE_KEY) throw new Error("Missing service role key");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Verify admin status
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid token");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Proceed to create match
    const body = await req.json();
    const { home_team, away_team, start_time, status, round } = body;

    const newMatch = {
      id: crypto.randomUUID(),
      api_fixture_id: Math.floor(Math.random() * 1000000), // dummy ID for manually created matches
      home_team,
      away_team,
      start_time,
      status,
      round: round || "Round of 32",
      home_score: null,
      away_score: null,
      scored: false
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("matches")
      .insert(newMatch)
      .select()
      .single();

    if (insertError) throw insertError;
    
    return NextResponse.json({
      message: "Match created successfully",
      match: inserted
    });

  } catch (error: any) {
    console.error("Create match error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
