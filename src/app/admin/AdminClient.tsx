"use client";

import React, { useState } from "react";
import { Match, Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const COUNTRIES = [
  { name: "TBD", flag: "❓" },
  { name: "Argentina", flag: "🇦🇷" }, { name: "Brazil", flag: "🇧🇷" }, { name: "France", flag: "🇫🇷" },
  { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, { name: "Spain", flag: "🇪🇸" }, { name: "Portugal", flag: "🇵🇹" },
  { name: "Germany", flag: "🇩🇪" }, { name: "Italy", flag: "🇮🇹" }, { name: "Netherlands", flag: "🇳🇱" },
  { name: "Belgium", flag: "🇧🇪" }, { name: "Croatia", flag: "🇭🇷" }, { name: "Uruguay", flag: "🇺🇾" },
  { name: "Colombia", flag: "🇨🇴" }, { name: "USA", flag: "🇺🇸" }, { name: "Mexico", flag: "🇲🇽" },
  { name: "Canada", flag: "🇨🇦" }, { name: "Senegal", flag: "🇸🇳" }, { name: "Morocco", flag: "🇲🇦" },
  { name: "Japan", flag: "🇯🇵" }, { name: "South Korea", flag: "🇰🇷" }, { name: "Saudi Arabia", flag: "🇸🇦" },
  { name: "Iran", flag: "🇮🇷" }, { name: "Australia", flag: "🇦🇺" }, { name: "Switzerland", flag: "🇨🇭" },
  { name: "Denmark", flag: "🇩🇰" }, { name: "Serbia", flag: "🇷🇸" }, { name: "Ecuador", flag: "🇪🇨" },
  { name: "Peru", flag: "🇵🇪" }, { name: "Chile", flag: "🇨🇱" }, { name: "Sweden", flag: "🇸🇪" },
  { name: "Poland", flag: "🇵🇱" }, { name: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" }, { name: "Ukraine", flag: "🇺🇦" },
  { name: "Nigeria", flag: "🇳🇬" }, { name: "Egypt", flag: "🇪🇬" }, { name: "Algeria", flag: "🇩🇿" },
  { name: "Ivory Coast", flag: "🇨🇮" }, { name: "Cameroon", flag: "🇨🇲" }, { name: "Ghana", flag: "🇬🇭" },
  { name: "Mali", flag: "🇲🇱" }, { name: "Qatar", flag: "🇶🇦" }, { name: "UAE", flag: "🇦🇪" },
  { name: "Iraq", flag: "🇮🇶" }, { name: "Oman", flag: "🇴🇲" }, { name: "Uzbekistan", flag: "🇺🇿" },
  { name: "China", flag: "🇨🇳" }, { name: "New Zealand", flag: "🇳🇿" }, { name: "Jamaica", flag: "🇯🇲" },
  { name: "Costa Rica", flag: "🇨🇷" }, { name: "Panama", flag: "🇵🇦" }, { name: "Honduras", flag: "🇭🇳" },
  { name: "El Salvador", flag: "🇸🇻" }, { name: "Venezuela", flag: "🇻🇪" }, { name: "Paraguay", flag: "🇵🇾" },
  { name: "Bolivia", flag: "🇧🇴" }, { name: "Turkey", flag: "🇹🇷" }, { name: "Norway", flag: "🇳🇴" },
  { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" }, { name: "Ireland", flag: "🇮🇪" }, { name: "Greece", flag: "🇬🇷" },
  { name: "Czech Republic", flag: "🇨🇿" }, { name: "Austria", flag: "🇦🇹" }, { name: "Hungary", flag: "🇭🇺" }
].sort((a, b) => a.name === "TBD" ? -1 : a.name.localeCompare(b.name));

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
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  
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

  const handleCreateMatch = async () => {
    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          home_team: "TBD",
          away_team: "TBD",
          start_time: new Date().toISOString(),
          status: "NS",
          round: "Round of 32"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create match");
      
      setMatches([data.match, ...matches]);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
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
  const handleUpdatePrediction = async (
    predId: string | null,
    matchId: string,
    userId: string,
    updates: any
  ) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch("/api/admin/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ predictionId: predId, match_id: matchId, user_id: userId, ...updates })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update prediction");
      
      if (predId) {
        setPredictions((prev) => prev.map((p) => (p.id === predId ? { ...p, ...updates } : p)));
      } else {
        setPredictions((prev) => [...prev, data.updated]);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4 hide-scrollbar whitespace-nowrap">
        {["matches", "users", "predictions"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-6 py-3 rounded-full font-bold uppercase tracking-widest flex-shrink-0 ${
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 p-6 rounded-[2rem] border border-white/10 wc-border-gradient gap-4">
            <div>
              <h2 className="text-xl font-bold">Matches & Scoring</h2>
              <p className="text-white/60 text-sm">Create matches, edit scores, and calculate points.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleCreateMatch}
                disabled={loading}
                className="flex-1 md:flex-none px-6 py-3 bg-wc-cyan/20 text-wc-cyan border border-wc-cyan/50 font-bold rounded-xl hover:bg-wc-cyan hover:text-black transition-colors disabled:opacity-50"
              >
                + Add Match
              </button>
              <button
                onClick={triggerScoring}
                disabled={loading}
                className="flex-1 md:flex-none px-6 py-3 bg-wc-red text-white font-bold rounded-xl hover:bg-wc-red-light disabled:opacity-50"
              >
                {loading ? "Calculating..." : "Force Calculate Points"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Match Teams */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <select
                    className="bg-black border border-white/20 rounded-lg p-2 min-w-[140px] font-medium"
                    value={match.home_team}
                    onChange={(e) => handleUpdateMatch(match.id, { home_team: e.target.value })}
                  >
                    {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                  <span className="text-white/40 text-xs font-bold px-2">VS</span>
                  <select
                    className="bg-black border border-white/20 rounded-lg p-2 min-w-[140px] font-medium"
                    value={match.away_team}
                    onChange={(e) => handleUpdateMatch(match.id, { away_team: e.target.value })}
                  >
                    {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                </div>

                {/* Match Time & Status */}
                <div className="flex flex-wrap items-center gap-4">
                  <input
                    type="datetime-local"
                    className="bg-black border border-white/20 rounded-lg p-2 text-white/60 text-xs min-w-[150px] outline-none focus:border-wc-cyan"
                    value={new Date(new Date(match.start_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    onChange={(e) => handleUpdateMatch(match.id, { start_time: new Date(e.target.value).toISOString() })}
                  />
                  
                  <select
                    className={`border rounded-lg p-2 min-w-[140px] font-bold ${
                      match.status === "FT" ? "bg-wc-green/20 border-wc-green text-wc-green" : 
                      match.status === "NS" ? "bg-black border-white/20 text-white/70" : 
                      "bg-wc-red/20 border-wc-red text-wc-red"
                    }`}
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

                {/* Manage Predictions Toggle Button */}
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                  <button 
                    onClick={() => setActiveMatchId(activeMatchId === match.id ? null : match.id)}
                    className="text-sm font-bold text-wc-purple hover:text-wc-purple-light"
                  >
                    {activeMatchId === match.id ? "Hide Predictions" : "Manage Predictions"}
                  </button>
                </div>

                {/* Manage Predictions Panel */}
                {activeMatchId === match.id && (
                  <div className="mt-4 bg-black/40 rounded-xl p-4 border border-white/5 space-y-3">
                    <h3 className="font-bold text-white/80 mb-2">User Predictions</h3>
                    {users.map(u => {
                      const userPred = predictions.find(p => p.match_id === match.id && p.user_id === u.id);
                      return (
                        <div key={u.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-2 hover:bg-white/5 rounded-lg border border-white/5 gap-2">
                          <div className="text-sm font-medium">{u.display_name} <span className="text-white/30 text-xs">({u.email})</span></div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-12 bg-black border border-white/20 rounded p-1 text-center text-sm"
                              placeholder="-"
                              value={userPred?.home_prediction ?? ""}
                              onChange={(e) => handleUpdatePrediction(
                                userPred?.id || null, 
                                match.id, 
                                u.id, 
                                { home_prediction: e.target.value === "" ? 0 : parseInt(e.target.value) }
                              )}
                            />
                            <span className="text-white/40">-</span>
                            <input
                              type="number"
                              className="w-12 bg-black border border-white/20 rounded p-1 text-center text-sm"
                              placeholder="-"
                              value={userPred?.away_prediction ?? ""}
                              onChange={(e) => handleUpdatePrediction(
                                userPred?.id || null, 
                                match.id, 
                                u.id, 
                                { away_prediction: e.target.value === "" ? 0 : parseInt(e.target.value) }
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
