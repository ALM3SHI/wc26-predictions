"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Crown, Medal } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/types";
import { HOST_RED, HOST_BLUE, HOST_GREEN, HOST_GOLD } from "@/lib/wc26-theme";

interface Props {
  top: LeaderboardEntry[];
  currentUserId: string | null;
}

const STEPS = [
  { rank: 2, height: 120, color: HOST_BLUE, delay: 0.2, medal: "silver" },
  { rank: 1, height: 170, color: HOST_GOLD, delay: 0.35, medal: "gold" },
  { rank: 3, height: 90, color: HOST_RED, delay: 0.2, medal: "bronze" },
];

export function Podium({ top, currentUserId }: Props) {
  const byRank = new Map(top.map((e) => [e.rank, e]));

  return (
    <div className="relative rounded-3xl border border-gray-200 bg-white p-6 md:p-8 mb-10 overflow-hidden">
      {/* stadium radial */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,184,28,0.15), transparent 60%), radial-gradient(circle at 20% 90%, rgba(200,16,46,0.12), transparent 55%), radial-gradient(circle at 80% 90%, rgba(0,104,71,0.12), transparent 55%)",
        }}
      />
      <div className="relative">
        <div className="text-center mb-8">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
            Podium — Top Predictors
          </div>
          <h2 className="font-fifa text-4xl md:text-5xl text-gray-900 uppercase">
            The Big Three
          </h2>
        </div>

        <div className="flex items-end justify-center gap-4 md:gap-8">
          {STEPS.map((step) => {
            const entry = byRank.get(step.rank);
            if (!entry) {
              return (
                <div
                  key={step.rank}
                  className="flex flex-col items-center flex-1 opacity-40"
                >
                  <div className="text-4xl mb-2">–</div>
                  <div
                    className="w-full max-w-[140px] rounded-t-xl bg-gray-200"
                    style={{ height: step.height }}
                  />
                </div>
              );
            }

            const isMe = currentUserId === entry.user_id;

            return (
              <motion.div
                key={step.rank}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: step.delay,
                  type: "spring",
                  stiffness: 180,
                  damping: 16,
                }}
                className="flex flex-col items-center flex-1 min-w-0"
              >
                <Link
                  href={`/user/${entry.user_id}`}
                  className="flex flex-col items-center"
                >
                  {step.rank === 1 ? (
                    <Crown
                      className="w-6 h-6 mb-1"
                      style={{ color: HOST_GOLD }}
                    />
                  ) : (
                    <Medal
                      className="w-5 h-5 mb-1"
                      style={{
                        color: step.medal === "silver" ? "#B8C1D1" : "#B98040",
                      }}
                    />
                  )}
                  <div className="relative">
                    <img
                      src={entry.avatar_url || "/images/default-avatar.png"}
                      alt={entry.display_name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 shadow-lg"
                      style={{ borderColor: step.color }}
                    />
                    {isMe && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="mt-3 font-fifa text-lg md:text-xl text-gray-900 uppercase truncate max-w-[140px] text-center">
                    {entry.display_name}
                  </div>
                  <div
                    className="font-fifa text-2xl md:text-3xl leading-none"
                    style={{ color: step.color }}
                  >
                    {entry.total_points}
                  </div>
                </Link>

                <div
                  className="mt-4 w-full max-w-[160px] rounded-t-xl shadow-inner text-white flex items-start justify-center pt-2"
                  style={{
                    height: step.height,
                    background: `linear-gradient(180deg, ${step.color}, ${step.color}cc)`,
                  }}
                >
                  <span className="font-fifa text-3xl md:text-4xl">
                    {step.rank}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div
          className="mt-4 h-2 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${HOST_RED}, ${HOST_BLUE}, ${HOST_GREEN})`,
          }}
        />
      </div>
    </div>
  );
}
