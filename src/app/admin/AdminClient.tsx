"use client";

import React, { useState } from "react";
import { Match, Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const COUNTRIES = [
  "TBD",
  "Argentina", "Brazil", "France",
  "England", "Spain", "Portugal",
  "Germany", "Italy", "Netherlands",
  "Belgium", "Croatia", "Uruguay",
  "Colombia", "USA", "Mexico",
  "Canada", "Senegal", "Morocco",
  "Japan", "South Korea", "Saudi Arabia",
  "Iran", "Australia", "Switzerland",
  "Denmark", "Serbia", "Ecuador",
  "Peru", "Chile", "Sweden",
  "Poland", "Wales", "Ukraine",
  "Nigeria", "Egypt", "Algeria",
  "Ivory Coast", "Cameroon", "Ghana",
  "Mali", "Qatar", "UAE",
  "Iraq", "Oman", "Uzbekistan",
  "China", "New Zealand", "Jamaica",
  "Costa Rica", "Panama", "Honduras",
  "El Salvador", "Venezuela", "Paraguay",
  "Bolivia", "Turkey", "Norway",
  "Scotland", "Ireland", "Greece",
  "Czech Republic", "Austria", "Hungary"
].sort((a, b) => a === "TBD" ? -1 : a.localeCompare(b));

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
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  
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

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId, updates })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user");
      
      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
    } catch (err: any) {
      alert("Error: " + err.message);
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
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4 no-scrollbar whitespace-nowrap max-w-full">
        {["matches", "users", "predictions"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-6 py-3 rounded-full font-bold uppercase tracking-widest flex-shrink-0 ${
              tab === t ? "bg-wc-purple text-white shadow-md" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* MATCHES TAB */}
      {tab === "matches" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Matches & Scoring</h2>
              <p className="text-gray-500 text-sm">Create matches, edit scores, and calculate points.</p>
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
                className="flex-1 md:flex-none px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 shadow-sm"
              >
                {loading ? "Calculating..." : "Force Calculate Points"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-4">
                
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  {/* Match Teams */}
                  <div className="flex items-center justify-between sm:justify-start gap-2 w-full xl:w-auto bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                    <select
                      className="bg-white border border-gray-200 rounded-lg p-2 flex-1 sm:w-[140px] font-medium text-gray-900 text-sm"
                      value={match.home_team}
                      onChange={(e) => handleUpdateMatch(match.id, { home_team: e.target.value })}
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="text-gray-400 text-xs font-bold">VS</span>
                    <select
                      className="bg-white border border-gray-200 rounded-lg p-2 flex-1 sm:w-[140px] font-medium text-gray-900 text-sm"
                      value={match.away_team}
                      onChange={(e) => handleUpdateMatch(match.id, { away_team: e.target.value })}
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Match Time & Status */}
                  <div className="flex items-center gap-2 w-full xl:w-auto">
                    <input
                      type="datetime-local"
                      className="bg-white border border-gray-200 rounded-lg p-2 text-gray-500 text-sm flex-1 xl:w-[160px] outline-none focus:border-wc-purple"
                      value={new Date(new Date(match.start_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      onChange={(e) => handleUpdateMatch(match.id, { start_time: new Date(e.target.value).toISOString() })}
                    />
                    
                    <select
                      className={`border rounded-lg p-2 flex-1 xl:w-[120px] font-bold text-sm ${
                        match.status === "FT" ? "bg-green-100 border-green-200 text-green-700" : 
                        match.status === "NS" ? "bg-gray-50 border-gray-200 text-gray-500" : 
                        "bg-red-100 border-red-200 text-red-700"
                      }`}
                      value={match.status}
                      onChange={(e) => handleUpdateMatch(match.id, { status: e.target.value as any })}
                    >
                      <option value="NS">NS</option>
                      <option value="1H">1H</option>
                      <option value="HT">HT</option>
                      <option value="2H">2H</option>
                      <option value="FT">FT</option>
                    </select>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-center gap-2 bg-gray-100 p-2 rounded-xl border border-gray-200 w-full xl:w-auto">
                    <input
                      type="number"
                      className="w-12 bg-white border border-gray-200 rounded-lg p-1 text-center font-bold text-gray-900 outline-none focus:border-wc-purple"
                      value={match.home_score ?? ""}
                      onChange={(e) => handleUpdateMatch(match.id, { home_score: parseInt(e.target.value) || 0 })}
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input
                      type="number"
                      className="w-12 bg-white border border-gray-200 rounded-lg p-1 text-center font-bold text-gray-900 outline-none focus:border-wc-purple"
                      value={match.away_score ?? ""}
                      onChange={(e) => handleUpdateMatch(match.id, { away_score: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Manage Predictions Toggle Button */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                  <button 
                    onClick={() => setActiveMatchId(activeMatchId === match.id ? null : match.id)}
                    className="text-sm font-bold text-wc-purple hover:text-wc-purple-light"
                  >
                    {activeMatchId === match.id ? "Hide Predictions" : "Manage Predictions"}
                  </button>
                </div>

                {/* Manage Predictions Panel */}
                {activeMatchId === match.id && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                    <h3 className="font-bold text-gray-900 mb-2">User Predictions</h3>
                    {users.map(u => {
                      const userPred = predictions.find(p => p.match_id === match.id && p.user_id === u.id);
                      return (
                        <div key={u.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-2 hover:bg-gray-100 rounded-lg border border-gray-200 gap-2">
                          <div className="font-bold text-gray-900">{u.display_name}</div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-12 bg-white border border-gray-200 rounded p-1 text-center text-sm text-gray-900"
                              placeholder="-"
                              value={userPred?.home_prediction ?? ""}
                              onChange={(e) => handleUpdatePrediction(
                                userPred?.id || null, 
                                match.id, 
                                u.id, 
                                { home_prediction: e.target.value === "" ? 0 : parseInt(e.target.value) }
                              )}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="number"
                              className="w-12 bg-white border border-gray-200 rounded p-1 text-center text-sm text-gray-900"
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
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Create Magic Account</h2>
            <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" placeholder="Display Name" required
                value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900"
              />
              <input 
                type="email" placeholder="Email" required
                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900"
              />
              <input 
                type="text" placeholder="Password" required
                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900"
              />
              <button type="submit" disabled={loading} className="px-6 py-3 bg-wc-purple text-white font-bold rounded-xl shadow-sm">
                Create User
              </button>
            </form>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold text-xs border-b border-gray-200">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Display Name</th>
                    <th className="p-4">Legacy Pts</th>
                    <th className="p-4">Total Pts</th>
                    <th className="p-4">Is Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-xs text-gray-400">{u.id.substring(0,8)}...</td>
                      <td className="p-4 font-bold text-gray-900 whitespace-nowrap">{u.display_name}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          className="w-20 bg-gray-50 border border-gray-200 rounded p-1 text-center text-wc-purple"
                          value={u.legacy_points ?? 0}
                          onChange={(e) => handleUpdateUser(u.id, { legacy_points: parseInt(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="p-4 font-bold text-gray-500">{u.total_points}</td>
                      <td className="p-4 text-gray-700">{u.is_admin ? "YES" : "NO"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PREDICTIONS TAB */}
      {tab === "predictions" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">Manage Predictions</h2>
            <select
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 font-bold w-full sm:w-64"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="all">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.display_name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold text-xs border-b border-gray-200">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Match</th>
                    <th className="p-4">Predicted Score</th>
                    <th className="p-4">Points Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {predictions
                    .filter(p => selectedUserId === "all" || p.user_id === selectedUserId)
                    .map(p => {
                      const u = users.find(user => user.id === p.user_id);
                      return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{u?.display_name || "Unknown"}</div>
                        <div className="text-xs text-gray-400 font-mono">{p.user_id.substring(0,8)}...</div>
                      </td>
                      <td className="p-4 text-gray-700 font-medium">{p.matches?.home_team} vs {p.matches?.away_team}</td>
                      <td className="p-4 flex items-center gap-2">
                        <input
                          type="number"
                          className="w-12 bg-gray-50 border border-gray-200 rounded p-1 text-center text-gray-900"
                          value={p.home_prediction ?? ""}
                          onChange={(e) => handleUpdatePrediction(p.id, p.match_id, p.user_id, { home_prediction: parseInt(e.target.value) || 0 })}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="number"
                          className="w-12 bg-gray-50 border border-gray-200 rounded p-1 text-center text-gray-900"
                          value={p.away_prediction ?? ""}
                          onChange={(e) => handleUpdatePrediction(p.id, p.match_id, p.user_id, { away_prediction: parseInt(e.target.value) || 0 })}
                        />
                      </td>
                        <td className="p-4">
                          <input
                            type="number"
                            className="w-16 bg-gray-50 border border-gray-200 rounded p-1 text-center text-gray-900"
                            value={p.points_earned ?? ""}
                            placeholder="null"
                            onChange={(e) => handleUpdatePrediction(p.id, p.match_id, p.user_id, { points_earned: e.target.value === "" ? null : parseInt(e.target.value) })}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
