import { assertRelayUrl, defaultRelayUrl } from './origin';
import {
  buildConnectDeepLink,
  buildConnectQrContent,
  createConnectRequest,
  DEFAULT_CHAIN_ID,
  type ConnectRequestPayload,
  type PayloadOrigin,
} from './payload';
import { qrDataUrl } from './qr';
import { waitForWalletProof, type WalletVerifyTransport } from './transport';
import type { WalletProof } from './proof';

export interface WalletVerifySession {
  payload: ConnectRequestPayload;
  deepLink: string;
  qrContent: string;
  qrUrl: string | null;
}

export async function beginWalletVerification(params: {
  origin: PayloadOrigin;
  chainId?: string;
  transport: WalletVerifyTransport;
  /**
   * Confirm URL Hope Wallet should POST to. Pass `true` to use
   * `{origin}/api/hope-wallet/sessions/{id}/confirm`.
   * Omit when using Hope Supabase link RPCs (wallet confirms there directly).
   */
  relayUrl?: string | true;
  expiresInMs?: number;
}): Promise<WalletVerifySession> {
  const payload = createConnectRequest({
    chainId: params.chainId?.trim() || DEFAULT_CHAIN_ID,
    origin: params.origin,
    expiresInMs: params.expiresInMs,
  });

  if (params.relayUrl) {
    payload.relay_url = assertRelayUrl(
      params.relayUrl === true
        ? defaultRelayUrl(payload.origin.url, payload.session_id)
        : params.relayUrl,
      payload.origin.url
    );
  }

  await params.transport.create(payload);
  const qrContent = buildConnectQrContent(payload);
  return {
    payload,
    deepLink: buildConnectDeepLink(payload),
    qrContent,
    qrUrl: await qrDataUrl(qrContent),
  };
}

export async function completeWalletVerification(params: {
  session: WalletVerifySession;
  transport: WalletVerifyTransport;
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<WalletProof> {
  return waitForWalletProof({
    sessionId: params.session.payload.session_id,
    transport: params.transport,
    intervalMs: params.intervalMs,
    timeoutMs: params.timeoutMs,
    signal: params.signal,
  });
}
