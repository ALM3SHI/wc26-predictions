"use client";

import React, { useState } from "react";
import { Match } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export default function AdminClient({ initialMatches }: { initialMatches: Match[] }) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleUpdateMatch = async (matchId: string, updates: Partial<Match>) => {
    try {
      const { error } = await supabase.from("matches").update(updates).eq("id", matchId);
      if (error) throw error;
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, ...updates } : m)));
      alert("Match updated successfully!");
    } catch (err: any) {
      alert("Failed to update match: " + err.message);
    }
  };

  const triggerScoring = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scoring/calculate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Scoring failed");
      alert(`Scoring complete! ${data.processedMatches} matches processed. ${data.pointsAwarded} points awarded.`);
    } catch (err: any) {
      alert("Failed to calculate scores: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/10 wc-border-gradient">
        <div>
          <h2 className="text-xl font-bold">Calculate Points</h2>
          <p className="text-white/60 text-sm">Distribute points to users for all FINISHED matches.</p>
        </div>
        <button
          onClick={triggerScoring}
          disabled={loading}
          className="px-6 py-3 bg-wc-red text-white font-bold rounded-xl hover:bg-wc-red-light disabled:opacity-50"
        >
          {loading ? "Calculating..." : "Force Calculate Points"}
        </button>
      </div>

      <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/50 text-white/60 uppercase tracking-wider font-bold text-xs">
              <tr>
                <th className="p-4">Match</th>
                <th className="p-4">Time</th>
                <th className="p-4">Status</th>
                <th className="p-4">Score</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-fifa text-xl tracking-wide">
                    {match.home_team} vs {match.away_team}
                  </td>
                  <td className="p-4 text-white/60">
                    {new Date(match.start_time).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <select
                      className="bg-black border border-white/20 rounded p-1"
                      value={match.status}
                      onChange={(e) => handleUpdateMatch(match.id, { status: e.target.value })}
                    >
                      <option value="NS">NS (Not Started)</option>
                      <option value="1H">1H (Live)</option>
                      <option value="HT">HT (Half Time)</option>
                      <option value="2H">2H (Live)</option>
                      <option value="FT">FT (Finished)</option>
                    </select>
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    <input
                      type="number"
                      className="w-12 bg-black border border-white/20 rounded p-1 text-center"
                      value={match.home_score ?? ""}
                      onChange={(e) =>
                        handleUpdateMatch(match.id, { home_score: parseInt(e.target.value) || 0 })
                      }
                    />
                    <span>-</span>
                    <input
                      type="number"
                      className="w-12 bg-black border border-white/20 rounded p-1 text-center"
                      value={match.away_score ?? ""}
                      onChange={(e) =>
                        handleUpdateMatch(match.id, { away_score: parseInt(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="p-4 text-wc-cyan text-xs">Auto-saves on change</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
