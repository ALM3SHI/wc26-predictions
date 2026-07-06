"use client";

import { useEffect, useState } from "react";
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/notifications";
import { GlassCard } from "@/components/ui/GlassCard";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function checkStatus() {
      if (!isPushSupported()) {
        setSupported(false);
        setLoading(false);
        return;
      }
      setSupported(true);
      
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscribed(!!sub);
      setLoading(false);
    }
    checkStatus();
  }, []);

  const handleTogglePush = async () => {
    setLoading(true);
    
    if (subscribed) {
      const success = await unsubscribeFromPush();
      if (success) {
        setSubscribed(false);
        // Remove from DB via API (this assumes we have an API or we just let it fail silently and get cleaned up)
        await fetch("/api/push/subscribe", { method: "DELETE" });
      }
    } else {
      const subscription = await subscribeToPush();
      if (subscription) {
        setSubscribed(true);
        // Save to DB
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription)
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-wc-black pt-8 pb-24 px-4 sm:px-6 relative">
      <div className="max-w-xl mx-auto relative z-10">
        <h1 className="font-display font-black text-3xl mb-8">Settings</h1>
        
        <GlassCard className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${subscribed ? 'bg-wc-green/20 text-wc-green' : 'bg-white/10 text-white/50'}`}>
              {subscribed ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-lg">Push Notifications</h3>
              <p className="text-sm text-white/50">
                {supported ? "Get reminded before kickoffs." : "Not supported on this device."}
              </p>
            </div>
          </div>
          
          {supported && (
            <button
              onClick={handleTogglePush}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                subscribed ? "bg-wc-green" : "bg-white/20"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  subscribed ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
