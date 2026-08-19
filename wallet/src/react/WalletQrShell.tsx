import { HopeQrImage } from './HopeQrImage';
import { GetHopeWallet } from './GetHopeWallet';
import { QR_IMAGE_SIZE } from '../qr';

export function WalletQrShell(props: {
  qrValue: string;
  deepLink: string;
  waitingLabel?: string;
  waiting?: boolean;
  error?: string | null;
  inApp?: boolean;
  openLabel?: string;
}) {
  if (props.inApp) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 8px', color: '#334155', fontSize: 14 }}>
        {props.error ? (
          <p style={{ color: '#b91c1c' }}>{props.error}</p>
        ) : (
          <p style={{ fontWeight: 600, color: '#0f172a' }}>
            {props.waitingLabel ?? 'Approve in Hope Wallet…'}
          </p>
        )}
        {props.deepLink ? (
          <p style={{ marginTop: 12 }}>
            <a href={props.deepLink} style={{ fontWeight: 600, color: '#3d6853' }}>
              {props.openLabel ?? 'Open Hope Wallet'}
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {props.error ? (
        <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 8 }}>{props.error}</p>
      ) : null}
      <p style={{ fontSize: 13, color: '#334155', marginBottom: 10 }}>
        Scan with Hope Wallet on your phone
      </p>
      <div
        style={{
          display: 'inline-block',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          background: '#fff',
          padding: 12,
        }}
      >
        <HopeQrImage value={props.qrValue} size={QR_IMAGE_SIZE} alt="Hope Wallet QR" />
      </div>
      {props.waiting ? (
        <p style={{ fontSize: 13, color: '#334155' }}>
          {props.waitingLabel ?? 'Waiting for Hope Wallet…'}
        </p>
      ) : null}
      <p style={{ marginTop: 10 }}>
        <a href={props.deepLink} style={{ fontSize: 13, fontWeight: 600, color: '#3d6853' }}>
          {props.openLabel ?? 'Open Hope Wallet'}
        </a>
      </p>
      <GetHopeWallet />
    </div>
  );
}
