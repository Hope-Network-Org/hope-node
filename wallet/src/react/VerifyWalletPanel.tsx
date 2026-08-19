import { useEffect, useRef, useState } from 'react';
import { connect } from '../connect';
import { isHopeWalletInApp } from '../inApp';
import type { PayloadOrigin } from '../origin';
import type { WalletProof } from '../proof';
import type { WalletVerifySession } from '../flow';
import type { WalletVerifyTransport } from '../transport';
import { WalletQrShell } from './WalletQrShell';

export type VerifyWalletPanelProps = {
  origin: PayloadOrigin;
  chainId?: string;
  transport: WalletVerifyTransport;
  relayUrl?: string | true;
  title?: string;
  description?: string;
  onVerified: (proof: WalletProof) => void;
  onError?: (message: string) => void;
  className?: string;
};

export function VerifyWalletPanel({
  origin,
  chainId,
  transport,
  relayUrl,
  title = 'Connect Hope Wallet',
  description = 'Scan this QR, or approve in Hope Wallet if this page is open in the app.',
  onVerified,
  onError,
  className,
}: VerifyWalletPanelProps) {
  const [session, setSession] = useState<WalletVerifySession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proof, setProof] = useState<WalletProof | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const inApp = isHopeWalletInApp();

  const transportRef = useRef(transport);
  transportRef.current = transport;
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const ac = new AbortController();
    setError(null);
    setProof(null);
    setWaiting(true);
    void (async () => {
      try {
        const next = await connect({
          origin,
          chainId,
          transport: transportRef.current,
          relayUrl,
          // Waiter-only: aborting must not cancel the shared cs_ on remount.
          signal: ac.signal,
          reuseKey: `${origin.url}|${chainId ?? ''}|${String(relayUrl ?? '')}|${attempt}`,
          onSession: (s) => setSession(s),
        });
        if (ac.signal.aborted) return;
        setWaiting(false);
        setProof(next);
        onVerifiedRef.current(next);
      } catch (e) {
        if (ac.signal.aborted) return;
        const message = e instanceof Error ? e.message : 'Could not connect';
        setError(message);
        setWaiting(false);
        onErrorRef.current?.(message);
      }
    })();
    return () => {
      ac.abort();
    };
  }, [origin.name, origin.url, chainId, relayUrl, attempt]);

  return (
    <div
      className={className}
      style={{
        border: '1px solid #d7e0d9',
        borderRadius: 16,
        padding: 20,
        background: '#fffef9',
        maxWidth: 520,
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#3d6853',
        }}
      >
        Hope Wallet
      </p>
      <h3 style={{ margin: '8px 0 4px', fontSize: 18, color: '#0f172a' }}>{title}</h3>
      <p style={{ margin: '0 0 14px', fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
        {description}
      </p>

      {proof ? (
        <p style={{ margin: 0, color: '#166534', fontWeight: 600, fontSize: 14 }}>
          Connected {proof.address.slice(0, 12)}…{proof.address.slice(-6)}
        </p>
      ) : (
        <WalletQrShell
          qrValue={session?.qrContent ?? ''}
          deepLink={session?.deepLink ?? ''}
          waiting={waiting}
          error={error}
          inApp={inApp}
        />
      )}

      {error ? (
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '11px 14px',
            borderRadius: 12,
            border: 'none',
            background: '#3d6853',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export default VerifyWalletPanel;
