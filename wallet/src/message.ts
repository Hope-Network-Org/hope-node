import { assertHopeAccountAddress } from './address';
import {
  isHopeWalletBridgeAvailable,
  isHopeWalletInApp,
  openHopeWalletDeepLink,
  requestMobileSign,
  waitForHopeWalletBridge,
} from './inApp';
import { qrDataUrl } from './qr';
import {
  buildSignDeepLink,
  buildSignQrContent,
  createSignPayload,
  encodeSignPayload,
  type InlineSignPayload,
  type MessagePreview,
  type WalletMessage,
} from './signPayload';
import type { PayloadOrigin } from './origin';

export interface MessageSession {
  payload: InlineSignPayload;
  encoded: string;
  deepLink: string;
  qrContent: string;
  qrUrl: string | null;
}

export type MessageResult =
  | { mode: 'in-app'; txhash: string; session: MessageSession }
  | { mode: 'qr'; txhash?: undefined; session: MessageSession };

export async function createMessageSession(params: {
  origin: PayloadOrigin;
  chainId?: string;
  account: string;
  preview: MessagePreview;
  messages: WalletMessage[];
  memo?: string;
  returnUrl?: string;
  expiresInMs?: number;
}): Promise<MessageSession> {
  const payload = createSignPayload({
    ...params,
    account: assertHopeAccountAddress(params.account, 'account'),
  });
  const encoded = encodeSignPayload(payload);
  const deepLink = buildSignDeepLink(payload);
  let qrContent: string;
  try {
    qrContent = buildSignQrContent(payload);
  } catch {
    qrContent = deepLink;
  }
  return {
    payload,
    encoded,
    deepLink,
    qrContent,
    qrUrl: await qrDataUrl(qrContent),
  };
}

/**
 * Ask Hope Wallet to sign/broadcast a tx you built (CosmWasm, bank, gov, …).
 * In-app: native overlay, returns txhash.
 * Otherwise: QR + deep link; the wallet broadcasts. Poll LCD yourself if you
 * need the hash after a camera scan.
 */
export async function message(params: {
  origin: PayloadOrigin;
  chainId?: string;
  account: string;
  preview: MessagePreview;
  messages: WalletMessage[];
  memo?: string;
  returnUrl?: string;
  expiresInMs?: number;
  onSession?: (session: MessageSession) => void;
}): Promise<MessageResult> {
  const session = await createMessageSession(params);
  params.onSession?.(session);

  if (isHopeWalletInApp()) {
    if (!isHopeWalletBridgeAvailable()) {
      await waitForHopeWalletBridge();
    }
    if (isHopeWalletBridgeAvailable()) {
      try {
        const { txhash } = await requestMobileSign(session.encoded);
        if (!txhash?.trim()) {
          throw new Error('Hope Wallet did not return a transaction hash');
        }
        return { mode: 'in-app', txhash: txhash.trim(), session };
      } catch {
        return { mode: 'qr', session };
      }
    }
    openHopeWalletDeepLink(session.deepLink);
    return { mode: 'qr', session };
  }

  // Desktop/mobile web: show the QR. Auto-opening hopewallet:// backgrounds
  // Discord/Safari and replaces the connect session the wallet already has.
  return { mode: 'qr', session };
}
