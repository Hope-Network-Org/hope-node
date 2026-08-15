import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildHostFollowUpCommands,
  completePayoutAuthorization,
  needsAuthorize,
  preparePayoutSetup,
  type HostFollowUpCommands,
  type PayloadOrigin,
  type PayoutSetupSession,
} from '../index';

export type AuthorizePayoutPanelProps = {
  operatorAddress: string;
  /** Pre-fill payout address if known */
  initialPayoutAddress?: string;
  origin: PayloadOrigin;
  chainId?: string;
  lcdBase?: string;
  containerName?: string;
  label?: string;
  /** Called when auth is confirmed (or skipped because same wallet). */
  onAuthorized: (result: {
    payoutAddress: string;
    skippedAuthorize: boolean;
    commands: HostFollowUpCommands;
  }) => void;
  className?: string;
};

/**
 * Drop-in React panel for NerdNode admin UIs.
 * 1) Enter cold payout hope1
 * 2) If ≠ operator → show Hope Wallet QR
 * 3) Poll LCD until authorized
 * 4) Return payout address + host CLI for update-node / bank send
 */
export function AuthorizePayoutPanel({
  operatorAddress,
  initialPayoutAddress = '',
  origin,
  chainId,
  lcdBase,
  containerName,
  label,
  onAuthorized,
  className,
}: AuthorizePayoutPanelProps) {
  const [payoutAddress, setPayoutAddress] = useState(initialPayoutAddress);
  const [session, setSession] = useState<PayoutSetupSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const sameWallet = useMemo(
    () =>
      payoutAddress.trim().length > 0 &&
      !needsAuthorize(operatorAddress, payoutAddress),
    [operatorAddress, payoutAddress]
  );

  useEffect(() => {
    if (!waiting || !session || session.phase !== 'awaiting_wallet') return;
    const ac = new AbortController();
    (async () => {
      try {
        const { commands } = await completePayoutAuthorization({
          payoutAddress: session.payoutAddress,
          operatorAddress: session.operatorAddress,
          lcdBase,
          containerName,
          label,
          signal: ac.signal,
        });
        setWaiting(false);
        setSession({ ...session, phase: 'authorized', alreadyAuthorized: true });
        onAuthorized({
          payoutAddress: session.payoutAddress,
          skippedAuthorize: false,
          commands,
        });
      } catch (e) {
        if (ac.signal.aborted) return;
        setWaiting(false);
        setError(e instanceof Error ? e.message : 'Authorization wait failed');
      }
    })();
    return () => ac.abort();
  }, [
    waiting,
    session,
    lcdBase,
    containerName,
    label,
    onAuthorized,
  ]);

  const start = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const next = await preparePayoutSetup({
        operatorAddress,
        payoutAddress,
        origin,
        chainId,
        lcdBase,
        label,
      });
      setSession(next);

      if (next.phase === 'skipped_same_wallet' || next.phase === 'authorized') {
        const commands = buildHostFollowUpCommands({
          payoutAddress: next.payoutAddress,
          containerName,
          label,
        });
        onAuthorized({
          payoutAddress: next.payoutAddress,
          skippedAuthorize: next.phase === 'skipped_same_wallet',
          commands,
        });
        return;
      }

      setWaiting(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start authorization');
    } finally {
      setBusy(false);
    }
  }, [
    operatorAddress,
    payoutAddress,
    origin,
    chainId,
    lcdBase,
    label,
    containerName,
    onAuthorized,
  ]);

  return (
    <div
      className={className}
      style={{
        border: '1px solid #d7e0d9',
        borderRadius: 16,
        padding: 20,
        background: '#fffef9',
        maxWidth: 440,
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
        Set payout wallet
      </p>
      <h3 style={{ margin: '8px 0 4px', fontSize: 18, color: '#0f172a' }}>
        Hope Wallet authorize
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
        Operator:{' '}
        <code style={{ fontSize: 12 }}>{operatorAddress.slice(0, 14)}…</code>
        {sameWallet ? ' — same as payout (no QR needed).' : null}
      </p>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569' }}>
        Payout address (hope1…)
        <input
          value={payoutAddress}
          onChange={(e) => setPayoutAddress(e.target.value.trim())}
          placeholder="hope1…"
          style={{
            display: 'block',
            width: '100%',
            marginTop: 6,
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />
      </label>

      <button
        type="button"
        disabled={busy || waiting || !payoutAddress.startsWith('hope1')}
        onClick={() => void start()}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: 12,
          border: 'none',
          background: '#3d6853',
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          opacity: busy || waiting || !payoutAddress.startsWith('hope1') ? 0.5 : 1,
        }}
      >
        {waiting ? 'Waiting for wallet…' : busy ? 'Preparing…' : 'Continue'}
      </button>

      {error ? (
        <p style={{ marginTop: 12, color: '#b91c1c', fontSize: 13 }}>{error}</p>
      ) : null}

      {session?.phase === 'awaiting_wallet' && session.qrUrl ? (
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#334155', marginBottom: 10 }}>
            Scan with Hope Wallet (account must be{' '}
            <code style={{ fontSize: 11 }}>{session.payoutAddress.slice(0, 12)}…</code>
            ). Sign <strong>Authorize operator</strong>, then this screen updates
            automatically.
          </p>
          <img
            src={session.qrUrl}
            alt="Hope Wallet authorize QR"
            width={240}
            height={240}
            style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
          />
          {session.deepLink ? (
            <p style={{ marginTop: 10, fontSize: 11, wordBreak: 'break-all', color: '#64748b' }}>
              <a href={session.deepLink}>{session.deepLink.slice(0, 48)}…</a>
            </p>
          ) : null}
        </div>
      ) : null}

      {session?.phase === 'authorized' || session?.phase === 'skipped_same_wallet' ? (
        <p style={{ marginTop: 14, color: '#166534', fontWeight: 600, fontSize: 14 }}>
          Payout ready: {session.payoutAddress.slice(0, 16)}…
        </p>
      ) : null}
    </div>
  );
}

export default AuthorizePayoutPanel;
