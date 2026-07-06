import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // New configuration for football-data.org
  const API_KEY = process.env.FOOTBALL_DATA_KEY || "a72b258b9b784e0ca8b1d909a0f09af1";

  if (!API_KEY) {
    return NextResponse.json({ error: "Missing API Key for football-data.org." }, { status: 500 });
  }

  try {
    // Fetch World Cup matches
    const url = `http://api.football-data.org/v4/competitions/WC/matches`;
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": API_KEY,
      },
      next: { revalidate: 0 },
    });

    const data = await response.json();
    return NextResponse.json({
      requestUrl: url,
      matchesCount: data.matches?.length || 0,
      data: data
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
