// ---------------------------------------------------------------------------
// Client-side push notification utilities
// ---------------------------------------------------------------------------

/**
 * Convert a URL-safe base64 VAPID public key to a Uint8Array
 * for use with PushManager.subscribe().
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Check whether the browser supports Web Push notifications.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Subscribe the current browser to push notifications.
 *
 * 1. Waits for the active service worker.
 * 2. Requests Notification permission from the user.
 * 3. Creates a push subscription using the app's VAPID public key.
 *
 * Returns the `PushSubscription` on success, or `null` if the user denies
 * permission or the browser doesn't support push.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('[push] Push notifications are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Ask the user for permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[push] Notification permission denied.');
      return null;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    return subscription;
  } catch (error) {
    console.error('[push] Failed to subscribe:', error);
    return null;
  }
}

/**
 * Unsubscribe the current browser from push notifications.
 * Returns `true` if successfully unsubscribed, `false` otherwise.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Nothing to unsubscribe from
      return true;
    }

    return await subscription.unsubscribe();
  } catch (error) {
    console.error('[push] Failed to unsubscribe:', error);
    return false;
  }
}
