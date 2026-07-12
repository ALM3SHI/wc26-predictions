"use client";

// ─────────────────────────────────────────────────────────────
// AdminBroadcast — form that fires a push notification to every
// user with a saved subscription. The server API iterates the
// subscriptions and streams counts back so we can show the exact
// delivery number after the send.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, AlertCircle, CheckCircle2, Megaphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";

export function AdminBroadcast() {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "ok"; count: number }
    | { kind: "err"; msg: string }
  >({ kind: "idle" });

  const send = async () => {
    if (!title.trim() || !body.trim()) return;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: "err", msg: data.message ?? t("admin.bc.err") });
        return;
      }
      setStatus({ kind: "ok", count: data.delivered ?? 0 });
      setTitle("");
      setBody("");
      setUrl("");
    } catch (e) {
      setStatus({
        kind: "err",
        msg: (e as Error).message ?? t("admin.bc.err"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: HOST_TRI_GRADIENT }}
        />
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-5 h-5 text-wc-purple" />
          <h2 className="text-xl font-bold text-gray-900">
            {t("admin.bc.title")}
          </h2>
        </div>
        <p className="text-gray-500 text-sm">{t("admin.bc.sub")}</p>
      </div>

      <div className="rounded-3xl bg-white p-6 border border-gray-200 shadow-sm space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">
            {t("admin.bc.subj")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">
            {t("admin.bc.body")}
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={280}
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900 resize-none"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">
            {t("admin.bc.url")}
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900"
            dir="ltr"
          />
        </div>

        {status.kind === "ok" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-emerald-600 text-sm font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t("admin.bc.sent").replace("{n}", String(status.count))}
          </motion.div>
        )}
        {status.kind === "err" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-500 text-sm font-bold"
          >
            <AlertCircle className="w-4 h-4" />
            {status.msg}
          </motion.div>
        )}

        <button
          type="button"
          onClick={send}
          disabled={
            status.kind === "sending" || !title.trim() || !body.trim()
          }
          className="w-full inline-flex items-center justify-center gap-2 gradient-purple-cyan text-white font-bold py-3 rounded-xl active:scale-95 disabled:opacity-60"
        >
          {status.kind === "sending" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("admin.bc.sending")}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t("admin.bc.send")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
