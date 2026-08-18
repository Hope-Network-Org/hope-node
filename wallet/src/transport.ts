import { PAIRING_TTL_MS, type ConnectRequestPayload } from './payload';
import { rowToProof, type WalletProof, type WalletVerifyRow } from './proof';

export interface WalletVerifyTransport {
  create(payload: ConnectRequestPayload): Promise<void>;
  get(sessionId: string): Promise<WalletVerifyRow | null>;
  cancel?(sessionId: string): Promise<void>;
}

export async function waitForWalletProof(params: {
  sessionId: string;
  transport: WalletVerifyTransport;
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<WalletProof> {
  const intervalMs = params.intervalMs ?? 1500;
  const timeoutMs = params.timeoutMs ?? PAIRING_TTL_MS;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (params.signal?.aborted) {
      throw new Error('Wallet verification wait aborted');
    }
    const row = await params.transport.get(params.sessionId);
    if (row?.status === 'cancelled') {
      throw new Error('Wallet verification was cancelled');
    }
    const proof = row ? rowToProof(row) : null;
    if (proof) return proof;
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('Timed out waiting for Hope Wallet');
}
