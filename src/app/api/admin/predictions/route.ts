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

    // Proceed to update prediction
    const { predictionId, home_prediction, away_prediction, points_earned } = await req.json();

    const updateData: any = {
      home_prediction: Number(home_prediction),
      away_prediction: Number(away_prediction),
      updated_at: new Date().toISOString()
    };

    if (points_earned !== undefined && points_earned !== "") {
      updateData.points_earned = Number(points_earned);
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("predictions")
      .update(updateData)
      .eq("id", predictionId);

    if (updateError) throw updateError;
    
    return NextResponse.json({
      message: "Prediction updated successfully",
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
