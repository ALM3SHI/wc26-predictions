"use client";

import React, { useState } from "react";
import { Match, Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const COUNTRIES = [
  "TBD", "Argentina", "Brazil", "France", "England", "Spain", "Portugal", "Germany", 
  "Italy", "Netherlands", "Belgium", "Croatia", "Uruguay", "Colombia", "USA", 
  "Mexico", "Canada", "Senegal", "Morocco", "Japan", "South Korea", "Saudi Arabia",
  "Iran", "Australia", "Switzerland", "Denmark", "Serbia", "Ecuador", "Peru",
  "Chile", "Sweden", "Poland", "Wales", "Ukraine", "Nigeria", "Egypt", "Algeria",
  "Ivory Coast", "Cameroon", "Ghana", "Mali", "Qatar", "UAE", "Iraq", "Oman",
  "Uzbekistan", "China", "New Zealand", "Jamaica", "Costa Rica", "Panama",
  "Honduras", "El Salvador", "Venezuela", "Paraguay", "Bolivia", "Turkey",
  "Norway", "Scotland", "Ireland", "Greece", "Czech Republic", "Austria", "Hungary"
].sort();

export default function AdminClient({
  initialMatches,
  initialUsers,
  initialPredictions,
}: {
  initialMatches: Match[];
  initialUsers: Profile[];
  initialPredictions: any[];
}) {
  const [tab, setTab] = useState<"matches" | "users" | "predictions">("matches");
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [predictions, setPredictions] = useState<any[]>(initialPredictions);
  const [loading, setLoading] = useState(false);
  
  const [newUser, setNewUser] = useState({ email: "", password: "", displayName: "" });

  const supabase = createClient();

  // Match Functions
  const handleUpdateMatch = async (matchId: string, updates: Partial<Match>) => {
    try {
      const { error } = await supabase.from("matches").update(updates).eq("id", matchId);
      if (error) throw error;
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, ...updates } : m)));
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

  // User Functions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create user");
      
      alert(`User ${data.user.email} created successfully! You can send them their password now.`);
      setNewUser({ email: "", password: "", displayName: "" });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prediction Functions
  const handleUpdatePrediction = async (predId: string, updates: any) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch("/api/admin/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ predictionId: predId, ...updates })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update prediction");
      
      setPredictions((prev) => prev.map((p) => (p.id === predId ? { ...p, ...updates } : p)));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        {["matches", "users", "predictions"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-6 py-3 rounded-full font-bold uppercase tracking-widest ${
              tab === t ? "bg-wc-cyan text-black" : "bg-white/10 text-white/50 hover:bg-white/20"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* MATCHES TAB */}
      {tab === "matches" && (
        <div className="space-y-6">
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

          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Match Teams */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <select
                    className="bg-black border border-white/20 rounded-lg p-2 min-w-[120px] text-center"
                    value={match.home_team}
                    onChange={(e) => handleUpdateMatch(match.id, { home_team: e.target.value })}
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="text-white/40 text-xs font-bold px-2">VS</span>
                  <select
                    className="bg-black border border-white/20 rounded-lg p-2 min-w-[120px] text-center"
                    value={match.away_team}
                    onChange={(e) => handleUpdateMatch(match.id, { away_team: e.target.value })}
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Match Time & Status */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-white/60 text-xs text-center md:text-left min-w-[100px]">
                    {new Date(match.start_time).toLocaleString()}
                  </div>
                  
                  <select
                    className="bg-black border border-white/20 rounded-lg p-2 min-w-[140px]"
                    value={match.status}
                    onChange={(e) => handleUpdateMatch(match.id, { status: e.target.value as any })}
                  >
                    <option value="NS">NS (Not Started)</option>
                    <option value="1H">1H (Live)</option>
                    <option value="HT">HT (Half Time)</option>
                    <option value="2H">2H (Live)</option>
                    <option value="FT">FT (Finished)</option>
                  </select>

                  {/* Score */}
                  <div className="flex items-center gap-2 bg-black/50 p-2 rounded-lg border border-white/10">
                    <input
                      type="number"
                      className="w-14 bg-transparent border-b border-white/20 p-1 text-center font-bold outline-none focus:border-wc-cyan"
                      value={match.home_score ?? ""}
                      onChange={(e) => handleUpdateMatch(match.id, { home_score: parseInt(e.target.value) || 0 })}
                    />
                    <span className="text-white/40">-</span>
                    <input
                      type="number"
                      className="w-14 bg-transparent border-b border-white/20 p-1 text-center font-bold outline-none focus:border-wc-cyan"
                      value={match.away_score ?? ""}
                      onChange={(e) => handleUpdateMatch(match.id, { away_score: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === "users" && (
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
            <h2 className="text-xl font-bold mb-4">Create Magic Account</h2>
            <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" placeholder="Display Name" required
                value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})}
                className="flex-1 bg-black border border-white/20 rounded-xl p-3"
              />
              <input 
                type="email" placeholder="Email" required
                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                className="flex-1 bg-black border border-white/20 rounded-xl p-3"
              />
              <input 
                type="text" placeholder="Password" required
                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                className="flex-1 bg-black border border-white/20 rounded-xl p-3"
              />
              <button type="submit" disabled={loading} className="px-6 py-3 bg-wc-cyan text-black font-bold rounded-xl">
                Create User
              </button>
            </form>
          </div>

          <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/50 text-white/60 uppercase tracking-wider font-bold text-xs">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Display Name</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Is Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="p-4 font-mono text-xs text-white/40">{u.id.substring(0,8)}...</td>
                    <td className="p-4 font-bold">{u.display_name}</td>
                    <td className="p-4 text-wc-cyan font-bold">{u.total_points}</td>
                    <td className="p-4">{u.is_admin ? "YES" : "NO"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PREDICTIONS TAB */}
      {tab === "predictions" && (
        <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/50 text-white/60 uppercase tracking-wider font-bold text-xs">
                <tr>
                  <th className="p-4">User ID</th>
                  <th className="p-4">Match</th>
                  <th className="p-4">Predicted Score</th>
                  <th className="p-4">Points Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {predictions.map(p => {
                  const u = users.find(user => user.id === p.user_id);
                  return (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="p-4">
                        <div className="font-bold">{u?.display_name || "Unknown"}</div>
                        <div className="text-xs text-white/40 font-mono">{p.user_id.substring(0,8)}...</div>
                      </td>
                      <td className="p-4">{p.matches?.home_team} vs {p.matches?.away_team}</td>
                      <td className="p-4 flex items-center gap-2">
                        <input
                          type="number"
                          className="w-12 bg-black border border-white/20 rounded p-1 text-center"
                          value={p.home_prediction ?? ""}
                          onChange={(e) => handleUpdatePrediction(p.id, { home_prediction: parseInt(e.target.value) || 0 })}
                        />
                        <span>-</span>
                        <input
                          type="number"
                          className="w-12 bg-black border border-white/20 rounded p-1 text-center"
                          value={p.away_prediction ?? ""}
                          onChange={(e) => handleUpdatePrediction(p.id, { away_prediction: parseInt(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          className="w-16 bg-black border border-white/20 rounded p-1 text-center"
                          value={p.points_earned ?? ""}
                          placeholder="null"
                          onChange={(e) => handleUpdatePrediction(p.id, { points_earned: e.target.value === "" ? null : parseInt(e.target.value) })}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
