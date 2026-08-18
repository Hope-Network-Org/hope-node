import { assertHopeAccountAddress } from './address';

export type WalletVerifyStatus = 'pending' | 'connected' | 'cancelled';

export interface WalletProof {
  sessionId: string;
  address: string;
  pubkeyBase64?: string;
  accountLabel?: string;
  connectedAt?: string;
}

export interface WalletVerifyRow {
  session_id: string;
  status: WalletVerifyStatus | string;
  address: string | null;
  pubkey_base64: string | null;
  account_label: string | null;
  connected_at: string | null;
}

export function parseWalletProof(body: unknown): WalletProof {
  if (!body || typeof body !== 'object') {
    throw new Error('Wallet proof must be a JSON object');
  }
  const o = body as Record<string, unknown>;
  const sessionId =
    (typeof o.session_id === 'string' && o.session_id) ||
    (typeof o.sessionId === 'string' && o.sessionId) ||
    '';
  if (!sessionId) throw new Error('Wallet proof is missing session_id');
  const addressRaw =
    (typeof o.address === 'string' && o.address) || '';
  const address = assertHopeAccountAddress(addressRaw);
  const pubkeyBase64 =
    (typeof o.pubkey_base64 === 'string' && o.pubkey_base64) ||
    (typeof o.pubkeyBase64 === 'string' && o.pubkeyBase64) ||
    undefined;
  const accountLabel =
    (typeof o.account_label === 'string' && o.account_label) ||
    (typeof o.accountLabel === 'string' && o.accountLabel) ||
    undefined;
  return {
    sessionId,
    address,
    pubkeyBase64: pubkeyBase64 || undefined,
    accountLabel: accountLabel || undefined,
  };
}

export function rowToProof(row: WalletVerifyRow): WalletProof | null {
  if (row.status !== 'connected' || !row.address) return null;
  return {
    sessionId: row.session_id,
    address: assertHopeAccountAddress(row.address),
    pubkeyBase64: row.pubkey_base64 ?? undefined,
    accountLabel: row.account_label ?? undefined,
    connectedAt: row.connected_at ?? undefined,
  };
}

export function walletConfirmBody(proof: {
  sessionId: string;
  address: string;
  pubkeyBase64?: string;
  accountLabel?: string;
}): Record<string, string> {
  const body: Record<string, string> = {
    session_id: proof.sessionId,
    address: assertHopeAccountAddress(proof.address),
  };
  if (proof.pubkeyBase64) body.pubkey_base64 = proof.pubkeyBase64;
  if (proof.accountLabel) body.account_label = proof.accountLabel;
  return body;
}
