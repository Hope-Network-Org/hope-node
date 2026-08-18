import type { CSSProperties } from 'react';
import {
  HOPE_WALLET_APP_STORE,
  HOPE_WALLET_IOS_LABEL,
  HOPE_WALLET_PLAY_STORE,
} from '../stores';

const linkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 600,
  color: '#334155',
  textDecoration: 'none',
};

export function GetHopeWallet() {
  return (
    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 8 }}>
      <p style={{ margin: 0, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
        Don&apos;t have Hope Wallet?
      </p>
      <p style={{ margin: '4px 0 12px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
        Install the app, then scan this QR.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        {HOPE_WALLET_APP_STORE ? (
          <a href={HOPE_WALLET_APP_STORE} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            iOS
          </a>
        ) : (
          <span
            title={HOPE_WALLET_IOS_LABEL}
            style={{ ...linkStyle, opacity: 0.55, cursor: 'not-allowed' }}
          >
            iOS
          </span>
        )}
        <a
          href={HOPE_WALLET_PLAY_STORE}
          target="_blank"
          rel="noopener noreferrer"
          title="Get it on Google Play"
          style={linkStyle}
        >
          Android
        </a>
      </div>
    </div>
  );
}
