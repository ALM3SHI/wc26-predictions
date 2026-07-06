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

    // Proceed to update or create prediction
    const { predictionId, user_id, match_id, home_prediction, away_prediction, points_earned } = await req.json();

    const upsertData: any = {
      updated_at: new Date().toISOString()
    };

    if (home_prediction !== undefined) upsertData.home_prediction = Number(home_prediction);
    if (away_prediction !== undefined) upsertData.away_prediction = Number(away_prediction);
    if (points_earned !== undefined && points_earned !== "") upsertData.points_earned = Number(points_earned);

    let updated;
    
    if (predictionId) {
      // Update existing prediction
      const { data, error } = await supabaseAdmin
        .from("predictions")
        .update(upsertData)
        .eq("id", predictionId)
        .select()
        .single();
        
      if (error) throw error;
      updated = data;
    } else if (user_id && match_id) {
      // Insert new prediction since ID was not provided
      upsertData.id = crypto.randomUUID();
      upsertData.user_id = user_id;
      upsertData.match_id = match_id;
      upsertData.points_earned = upsertData.points_earned || 0;
      upsertData.scored = false;
      upsertData.created_at = new Date().toISOString();
      
      const { data, error } = await supabaseAdmin
        .from("predictions")
        .insert(upsertData)
        .select()
        .single();
        
      if (error) throw error;
      updated = data;
    } else {
      throw new Error("Missing predictionId or (user_id and match_id)");
    }
    
    return NextResponse.json({
      message: "Prediction saved successfully",
      updated
    });

  } catch (error: any) {
    console.error("Update prediction error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
