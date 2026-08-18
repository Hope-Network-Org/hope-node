import type { ConnectRequestPayload } from './payload';
import type { WalletVerifyRow } from './proof';
import type { WalletVerifyTransport } from './transport';

/** Minimal client surface — pass your existing `supabase` instance. */
export interface RpcClient {
  rpc(
    fn: string,
    args: Record<string, unknown>
  ): Promise<{ data: unknown; error: { message: string } | null }>;
}

/**
 * Transport for the Hope `hope_wallet_link_*` RPCs (Explorer / DEX).
 * Hope Wallet confirms through its own Supabase config unless the QR includes `relay_url`.
 */
export function createSupabaseTransport(client: RpcClient): WalletVerifyTransport {
  return {
    async create(payload: ConnectRequestPayload) {
      const { error } = await client.rpc('hope_wallet_link_create', {
        p_session_id: payload.session_id,
        p_explorer_origin: payload.origin.url,
        p_expires_at: payload.expires_at,
      });
      if (error) throw new Error(error.message);
    },
    async get(sessionId: string) {
      const { data, error } = await client.rpc('hope_wallet_link_get', {
        p_session_id: sessionId,
      });
      if (error) throw new Error(error.message);
      const row = (Array.isArray(data) ? data[0] : data) as WalletVerifyRow | null;
      return row?.session_id ? row : null;
    },
    async cancel(sessionId: string) {
      await client.rpc('hope_wallet_link_cancel', { p_session_id: sessionId });
    },
  };
}
