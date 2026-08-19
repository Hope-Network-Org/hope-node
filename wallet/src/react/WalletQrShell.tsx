import { HopeQrImage } from './HopeQrImage';
import { GetHopeWallet } from './GetHopeWallet';
import { QR_IMAGE_SIZE, qrDisplaySize } from '../qr';

const QR_FRAME_PADDING = 12;

export function WalletQrShell(props: {
  qrValue: string;
  deepLink: string;
  waitingLabel?: string;
  waiting?: boolean;
  error?: string | null;
  inApp?: boolean;
  openLabel?: string;
}) {
  const qrSize = qrDisplaySize(props.qrValue, QR_IMAGE_SIZE);
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
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      {props.error ? (
        <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 8 }}>{props.error}</p>
      ) : null}
      <p style={{ fontSize: 13, color: '#334155', marginBottom: 10 }}>
        Scan with Hope Wallet on your phone
      </p>
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            background: '#fff',
            padding: QR_FRAME_PADDING,
            boxSizing: 'border-box',
            width: `min(100%, ${qrSize + QR_FRAME_PADDING * 2}px)`,
          }}
        >
          <HopeQrImage value={props.qrValue} size={qrSize} alt="Hope Wallet QR" />
        </div>
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
