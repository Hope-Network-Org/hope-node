import { assertHopeAccountAddress } from './address';
import { assertOrigin, type PayloadOrigin } from './origin';
import { DEFAULT_CHAIN_ID, PAIRING_TTL_MS } from './payload';
import { MAX_QR_CHARS } from './qr';

export type { PayloadOrigin };

export interface WalletMessage {
  typeUrl: string;
  value: Record<string, unknown>;
}

export interface MessagePreview {
  title: string;
  summary: string;
  messages?: Array<{
    type: string;
    from?: string;
    to?: string;
    amount?: string;
    denom?: string;
    summary?: string;
  }>;
  fee?: { amount: string; denom: string; gas: string };
}

export interface InlineSignPayload {
  id: string;
  chain_id: string;
  expires_at: string;
  origin: PayloadOrigin;
  account_hint?: string;
  preview: MessagePreview & { messages: NonNullable<MessagePreview['messages']> };
  return_url?: string;
  transaction?: {
    memo?: string;
    messages: WalletMessage[];
  };
}

export function isInlineSignPayload(value: unknown): value is InlineSignPayload {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  const origin = o.origin;
  if (!origin || typeof origin !== 'object') return false;
  const org = origin as Record<string, unknown>;
  const preview = o.preview;
  if (!preview || typeof preview !== 'object') return false;
  return (
    typeof o.id === 'string' &&
    o.id.length > 0 &&
    typeof o.chain_id === 'string' &&
    typeof o.expires_at === 'string' &&
    typeof org.name === 'string' &&
    typeof org.url === 'string' &&
    !('session_id' in o) &&
    o.v !== 1
  );
}

export function createSignPayload(params: {
  chainId?: string;
  origin: PayloadOrigin;
  account: string;
  preview: MessagePreview;
  messages: WalletMessage[];
  memo?: string;
  returnUrl?: string;
  expiresInMs?: number;
}): InlineSignPayload {
  const origin = assertOrigin(params.origin);
  const account = assertHopeAccountAddress(params.account, 'account');
  if (!params.messages.length) {
    throw new Error('At least one transaction message is required');
  }
  const title = params.preview.title.trim();
  const summary = params.preview.summary.trim();
  if (!title || !summary) {
    throw new Error('preview.title and preview.summary are required');
  }

  return {
    id: `pl_${crypto.randomUUID().replace(/-/g, '')}`,
    chain_id: params.chainId?.trim() || DEFAULT_CHAIN_ID,
    expires_at: new Date(
      Date.now() + (params.expiresInMs ?? PAIRING_TTL_MS)
    ).toISOString(),
    origin,
    account_hint: account,
    return_url: params.returnUrl,
    preview: {
      title,
      summary,
      messages:
        params.preview.messages?.length ?
          params.preview.messages
        : [{ type: 'tx', summary }],
      fee: params.preview.fee,
    },
    transaction: {
      memo: params.memo,
      messages: params.messages,
    },
  };
}

export function encodeSignPayload(payload: InlineSignPayload): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function decodeSignPayload(encoded: string): InlineSignPayload {
  const json = decodeURIComponent(escape(atob(encoded)));
  const parsed: unknown = JSON.parse(json);
  if (!isInlineSignPayload(parsed)) {
    throw new Error('Not a Hope Wallet sign payload');
  }
  return parsed;
}

export function buildSignDeepLink(payload: InlineSignPayload): string {
  const p = encodeURIComponent(encodeSignPayload(payload));
  return `hopewallet://sign?p=${p}`;
}

/**
 * Compact QR body (raw base64). Hope Wallet scan accepts this; the deep link
 * is used for Open Hope Wallet / in-app handoff.
 */
export function buildSignQrContent(payload: InlineSignPayload): string {
  const encoded = encodeSignPayload(payload);
  if (encoded.length <= MAX_QR_CHARS) return encoded;
  const deep = buildSignDeepLink(payload);
  if (deep.length <= MAX_QR_CHARS) return deep;
  throw new Error(
    `Sign request is too large for a QR (${encoded.length} chars). Use Open Hope Wallet.`
  );
}

export function isSignPayloadExpired(payload: InlineSignPayload): boolean {
  return new Date(payload.expires_at).getTime() < Date.now();
}
