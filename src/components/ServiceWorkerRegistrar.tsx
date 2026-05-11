'use client';
import { useEffect } from 'react';

interface Props {
  vapidPublicKey: string;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function ServiceWorkerRegistrar({ vapidPublicKey }: Props) {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !vapidPublicKey) return;

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        });
      }
    });
  }, [vapidPublicKey]);

  return null;
}
