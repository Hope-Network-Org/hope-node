import type { ConnectRequestPayload } from './payload';
import type { WalletVerifyRow } from './proof';
import type { WalletVerifyTransport } from './transport';

export function createHttpTransport(params: {
  /** e.g. `https://your.app/api/hope-wallet` */
  baseUrl: string;
  fetch?: typeof fetch;
}): WalletVerifyTransport {
  const base = params.baseUrl.replace(/\/$/, '');
  const fetchFn = params.fetch ?? fetch;

  return {
    async create(payload: ConnectRequestPayload) {
      const res = await fetchFn(`${base}/sessions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Could not create verification session (${res.status})`);
      }
    },
    async get(sessionId: string) {
      const res = await fetchFn(
        `${base}/sessions/${encodeURIComponent(sessionId)}`,
        { headers: { accept: 'application/json' } }
      );
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new Error(`Verification session lookup failed (${res.status})`);
      }
      return (await res.json()) as WalletVerifyRow;
    },
    async cancel(sessionId: string) {
      await fetchFn(`${base}/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      });
    },
  };
}
