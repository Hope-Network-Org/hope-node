import { assertOrigin, assertRelayUrl, type PayloadOrigin } from './origin';

export const DEFAULT_CHAIN_ID = 'hope-testnet-2';
export const PAIRING_TTL_MS = 5 * 60 * 1000;

export type { PayloadOrigin };

export interface ConnectRequestPayload {
  v: 1;
  session_id: string;
  chain_id: string;
  origin: PayloadOrigin;
  expires_at: string;
  /**
   * HTTPS URL on `origin.url` that Hope Wallet POSTs the proof to.
   * Omit when using Hope’s built-in Supabase link RPCs.
   */
  relay_url?: string;
}

export function isConnectRequestPayload(value: unknown): value is ConnectRequestPayload {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  const origin = o.origin;
  if (!origin || typeof origin !== 'object') return false;
  const org = origin as Record<string, unknown>;
  if (o.relay_url != null && typeof o.relay_url !== 'string') return false;
  return (
    o.v === 1 &&
    typeof o.session_id === 'string' &&
    o.session_id.length > 0 &&
    typeof o.chain_id === 'string' &&
    typeof o.expires_at === 'string' &&
    typeof org.name === 'string' &&
    typeof org.url === 'string' &&
    !('preview' in o) &&
    !('transaction' in o)
  );
}

export function createConnectRequest(params: {
  chainId: string;
  origin: PayloadOrigin;
  relayUrl?: string;
  expiresInMs?: number;
}): ConnectRequestPayload {
  const origin = assertOrigin(params.origin);
  const chainId = params.chainId.trim();
  if (!chainId) throw new Error('chainId is required');
  const sessionId = `cs_${crypto.randomUUID().replace(/-/g, '')}`;
  const payload: ConnectRequestPayload = {
    v: 1,
    session_id: sessionId,
    chain_id: chainId,
    origin,
    expires_at: new Date(Date.now() + (params.expiresInMs ?? PAIRING_TTL_MS)).toISOString(),
  };
  if (params.relayUrl) {
    payload.relay_url = assertRelayUrl(params.relayUrl, origin.url);
  }
  return payload;
}

export function encodeConnectPayload(payload: ConnectRequestPayload): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function decodeConnectPayload(encoded: string): ConnectRequestPayload {
  const json = decodeURIComponent(escape(atob(encoded)));
  const parsed: unknown = JSON.parse(json);
  if (!isConnectRequestPayload(parsed)) {
    throw new Error('Not a wallet verification payload');
  }
  return parsed;
}

export function buildConnectDeepLink(payload: ConnectRequestPayload): string {
  const p = encodeURIComponent(encodeConnectPayload(payload));
  return `hopewallet://connect?p=${p}`;
}

export function buildConnectQrContent(payload: ConnectRequestPayload): string {
  return buildConnectDeepLink(payload);
}

export function isConnectPayloadExpired(payload: ConnectRequestPayload): boolean {
  return new Date(payload.expires_at).getTime() < Date.now();
}

export function parseConnectUrl(url: string): ConnectRequestPayload | null {
  try {
    const trimmed = url.trim();
    if (trimmed.startsWith('hopewallet://connect')) {
      const q = trimmed.split('?')[1] ?? '';
      const p = new URLSearchParams(q).get('p');
      if (!p) return null;
      return decodeConnectPayload(decodeURIComponent(p));
    }
    if (/^[A-Za-z0-9+/=_-]+$/.test(trimmed) && trimmed.length > 24) {
      return decodeConnectPayload(trimmed);
    }
  } catch {
    return null;
  }
  return null;
}
