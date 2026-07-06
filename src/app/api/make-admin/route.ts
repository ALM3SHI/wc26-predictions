import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Missing service role key" });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const targetEmails = ["xalm3shix@gmail.com", "mohammed1399.tt@gmail.com"];
    const results = [];

    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json({ error: authError.message });
    }

    for (const email of targetEmails) {
      const user = users.find(u => u.email === email);
      if (user) {
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ is_admin: true })
          .eq("id", user.id);
          
        if (updateError) {
          results.push({ email, status: "error", message: updateError.message });
        } else {
          results.push({ email, status: "success", message: "is now an admin!" });
        }
      } else {
        results.push({ email, status: "not_found", message: "User not registered in Auth yet." });
      }
    }

    return NextResponse.json({ results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
