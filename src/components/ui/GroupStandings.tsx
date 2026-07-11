"use client";

import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import type { FDStandingGroup } from "@/lib/football-data";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { getFlagPath } from "@/lib/utils";

interface Props {
  groups: FDStandingGroup[];
}

export function GroupStandings({ groups }: Props) {
  if (!groups.length) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        Group standings not published yet.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 md:p-6 relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />

      <div className="flex items-center gap-3 mb-6">
        <LayoutGrid className="w-5 h-5 text-gray-700" />
        <h3 className="font-fifa text-2xl md:text-3xl uppercase text-gray-900">
          Group Standings
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map((g, gi) => (
          <motion.div
            key={g.group}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: (gi % 6) * 0.05 }}
            className="rounded-2xl border border-gray-200 overflow-hidden"
          >
            <div className="px-3 py-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white flex items-center justify-between">
              <span className="font-fifa text-lg uppercase tracking-wider">
                {g.group}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-white/70">
                {g.table.length} teams
              </span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[9px] uppercase text-gray-500 border-b border-gray-100">
                  <th className="py-2 px-2 text-left">#</th>
                  <th className="py-2 px-2 text-left">Team</th>
                  <th className="py-2 text-center">P</th>
                  <th className="py-2 text-center">W</th>
                  <th className="py-2 text-center">D</th>
                  <th className="py-2 text-center">L</th>
                  <th className="py-2 text-center">GD</th>
                  <th className="py-2 pr-2 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {g.table.map((row) => {
                  const qualifies = row.position <= 2;
                  return (
                    <tr
                      key={row.team.id}
                      className={`border-b border-gray-50 last:border-b-0 ${
                        qualifies ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <td className="py-2 px-2">
                        <span
                          className={`inline-block w-4 h-4 rounded-full text-[10px] leading-4 text-center font-bold text-white ${
                            row.position === 1
                              ? "bg-amber-400"
                              : row.position === 2
                                ? "bg-emerald-500"
                                : "bg-gray-300"
                          }`}
                        >
                          {row.position}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={getFlagPath(row.team.name)}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-gray-100 shrink-0"
                          />
                          <span className="font-bold text-gray-900 truncate">
                            {row.team.shortName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-center text-gray-700">
                        {row.playedGames}
                      </td>
                      <td className="py-2 text-center text-emerald-600 font-bold">
                        {row.won}
                      </td>
                      <td className="py-2 text-center text-gray-500">
                        {row.draw}
                      </td>
                      <td className="py-2 text-center text-red-500">
                        {row.lost}
                      </td>
                      <td className="py-2 text-center text-gray-700">
                        {row.goalDifference > 0
                          ? `+${row.goalDifference}`
                          : row.goalDifference}
                      </td>
                      <td className="py-2 pr-2 text-center font-fifa text-base text-gray-900">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[10px] uppercase tracking-widest text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> 1st
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          Qualifies
        </span>
      </div>
    </div>
  );
}
