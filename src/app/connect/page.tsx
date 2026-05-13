'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ConnectContent() {
  const searchParams = useSearchParams();
  const connectionId = searchParams.get('connection_id');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (connectionId) {
      fetch('/api/connect')
        .then((r) => r.json())
        .then((d) => setUserToken(d.userToken));
    } else if (!error) {
      fetch('/api/connect?action=status')
        .then((r) => r.json())
        .then((d) => setAlreadyConnected(d.connected));
    }
  }, [connectionId, error]);

  async function connect() {
    setLoading(true);
    const res = await fetch('/api/connect');
    const { webviewUrl } = await res.json();
    window.location.href = webviewUrl;
  }

  async function copy() {
    if (!userToken) return;
    await navigator.clipboard.writeText(userToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (connectionId) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">Bank connected successfully.</p>
          <p className="text-green-700 text-sm mt-1">Connection ID: <code>{connectionId}</code></p>
        </div>

        {userToken && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">Final step — add this to your environment</p>
            <p className="text-sm text-gray-600">
              Copy the token below and add it to <code>.env.local</code> (and Netlify env vars):
            </p>
            <div className="bg-gray-50 rounded p-3 font-mono text-xs break-all">
              POWENS_USER_TOKEN={userToken}
            </div>
            <button
              onClick={copy}
              className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
            >
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <p className="text-xs text-gray-400">
              Also register your webhook in the Powens console:{' '}
              <strong>{window.location.origin}/api/webhook/powens</strong>{' '}
              — event type: <strong>ACCOUNT_SYNCED</strong>
            </p>
          </div>
        )}

        <a href="/" className="inline-block text-sm text-gray-600 hover:text-gray-900 underline">
          Go to app →
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Connection failed</p>
          <p className="text-red-700 text-sm mt-1">{errorDescription ?? error}</p>
        </div>
        <button
          onClick={connect}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Try again'}
        </button>
      </div>
    );
  }

  if (alreadyConnected) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">Bank already connected.</p>
          <p className="text-green-700 text-sm mt-1">Your account is active — no setup needed.</p>
        </div>
        <a href="/" className="inline-block text-sm text-gray-600 hover:text-gray-900 underline">
          Go to app →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alreadyConnected === null && (
        <p className="text-sm text-gray-400">Checking connection…</p>
      )}
      {alreadyConnected === false && (
        <>
          <p className="text-gray-600 text-sm">
            Connect your CIC bank account. You will be redirected to the Powens secure webview.
            This is a one-time setup.
          </p>
          <button
            onClick={connect}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Connect CIC bank'}
          </button>
        </>
      )}
    </div>
  );
}

export default function ConnectPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <h1 className="text-xl font-bold">Bank connection</h1>
      <Suspense fallback={<p className="text-sm text-gray-400">Loading…</p>}>
        <ConnectContent />
      </Suspense>
    </div>
  );
}
