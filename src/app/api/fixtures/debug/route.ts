import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get("league") || "1"; // Default to 1 (World Cup)
  const season = searchParams.get("season") || "2026"; // Default to 2026
  
  const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
  const API_FOOTBALL_HOST = process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";

  if (!API_FOOTBALL_KEY) {
    return NextResponse.json({ error: "Missing API_FOOTBALL_KEY in environment variables." }, { status: 500 });
  }

  try {
    const url = `https://${API_FOOTBALL_HOST}/fixtures?league=${league}&season=${season}`;
    const response = await fetch(url, {
      headers: {
        "x-apisports-key": API_FOOTBALL_KEY,
      },
      next: { revalidate: 0 }, // Ensure it doesn't cache
    });

    const data = await response.json();
    return NextResponse.json({
      requestUrl: url,
      resultsCount: data.results,
      data: data
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
