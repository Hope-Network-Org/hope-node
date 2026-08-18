import { useEffect, useRef, useState } from 'react';
import { isHopeWalletInApp } from '../inApp';
import { message, type MessageResult, type MessageSession } from '../message';
import type { PayloadOrigin } from '../origin';
import type { MessagePreview, WalletMessage } from '../signPayload';
import { WalletQrShell } from './WalletQrShell';

export type MessagePanelProps = {
  origin: PayloadOrigin;
  chainId?: string;
  account: string;
  preview: MessagePreview;
  messages: WalletMessage[];
  memo?: string;
  title?: string;
  onComplete: (result: MessageResult) => void;
  onError?: (message: string) => void;
  className?: string;
};

export function MessagePanel({
  origin,
  chainId,
  account,
  preview,
  messages,
  memo,
  title,
  onComplete,
  onError,
  className,
}: MessagePanelProps) {
  const [session, setSession] = useState<MessageSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<MessageResult | null>(null);
  const inApp = isHopeWalletInApp();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setDone(null);
    void (async () => {
      try {
        const result = await message({
          origin,
          chainId,
          account,
          preview,
          messages: messagesRef.current,
          memo,
          onSession: (s) => {
            if (!cancelled) setSession(s);
          },
        });
        if (cancelled) return;
        setDone(result);
        onCompleteRef.current(result);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Sign request failed';
        setError(msg);
        onErrorRef.current?.(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [origin.name, origin.url, chainId, account, preview.title, preview.summary, memo]);

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
        Hope Wallet
      </p>
      <h3 style={{ margin: '8px 0 4px', fontSize: 18, color: '#0f172a' }}>
        {title ?? preview.title}
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
        {preview.summary}
      </p>

      {done?.mode === 'in-app' ? (
        <p style={{ color: '#166534', fontWeight: 600, fontSize: 14 }}>
          Signed {done.txhash.slice(0, 12)}…
        </p>
      ) : (
        <WalletQrShell
          qrValue={session?.qrContent ?? ''}
          deepLink={session?.deepLink ?? ''}
          waiting={!done && !error}
          waitingLabel="Sign in Hope Wallet when the prompt appears, or scan this QR."
          error={error}
          inApp={inApp}
        />
      )}
    </div>
  );
}

export default MessagePanel;
