"use client";

// ─────────────────────────────────────────────────────────────
// AdminBroadcast — form that fires a push notification to every
// user with a saved subscription. Now with:
//   • URL field is truly optional; empty passes cleanly to the API
//   • Explicit http/https validation only when the field is used
//   • Confirmation modal before dispatching so a stray tap can't
//     spam every device on the platform
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Megaphone,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";

type SendStatus =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "ok"; count: number }
  | { kind: "err"; msg: string };

function isValidHttpUrl(v: string): boolean {
  if (!v) return true; // empty is fine
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function AdminBroadcast() {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<SendStatus>({ kind: "idle" });
  const [confirming, setConfirming] = useState(false);

  const openConfirm = () => {
    if (!title.trim() || !body.trim()) return;
    if (!isValidHttpUrl(url.trim())) {
      setStatus({ kind: "err", msg: t("admin.bc.invalidUrl") });
      return;
    }
    setStatus({ kind: "idle" });
    setConfirming(true);
  };

  const send = async () => {
    setConfirming(false);
    setStatus({ kind: "sending" });
    try {
      const cleanUrl = url.trim();
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          // Explicit null when empty — never send an invalid or
          // half-typed URL through to web-push.
          url: cleanUrl.length > 0 ? cleanUrl : null,
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
          {/* Deliberately unmarked as required and no pattern attribute —
              this field is truly optional. We validate the format only
              on submit, and only when it has content. */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="ltr-input w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900"
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
          onClick={openConfirm}
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

      {/* Confirmation modal — blast radius is every device, so an
          extra tap here is worth the friction. */}
      {confirming && (
        <div
          onClick={() => setConfirming(false)}
          className="fixed inset-0 z-[95] bg-black/60 backdrop-blur flex items-center justify-center px-4"
          role="dialog"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  {t("admin.bc.confirm.title")}
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-snug">
                  {t("admin.bc.confirm.sub")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Message preview */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 mb-4">
              <div className="font-bold text-sm text-gray-900 truncate">
                {title}
              </div>
              <div className="text-xs text-gray-600 mt-0.5 line-clamp-3">
                {body}
              </div>
              {url && (
                <div className="text-[10px] text-wc-purple mt-1 truncate" dir="ltr">
                  → {url}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold active:scale-95"
              >
                {t("admin.bc.confirm.cancel")}
              </button>
              <button
                type="button"
                onClick={send}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold active:scale-95"
              >
                {t("admin.bc.confirm.go")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
