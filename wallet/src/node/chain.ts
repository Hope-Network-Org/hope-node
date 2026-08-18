import { bytesToBase64 } from '@hope/tx';

export const DEFAULT_LCD_BASE = 'https://test-gateway.hopenetwork.io/api';
export const DEFAULT_RPC_BASE = 'https://test-gateway.hopenetwork.io/rpc/';

export interface ChainAccount {
  accountNumber: number;
  sequence: number;
  publicKey: Uint8Array | null;
}

function lcdPath(lcdBase: string, path: string): string {
  return `${lcdBase.replace(/\/$/, '')}${path}`;
}

export async function fetchChainAccount(
  address: string,
  lcdBase: string = DEFAULT_LCD_BASE
): Promise<ChainAccount> {
  const res = await fetch(
    lcdPath(lcdBase, `/cosmos/auth/v1beta1/accounts/${encodeURIComponent(address)}`)
  );
  if (res.status === 404) {
    return { accountNumber: 0, sequence: 0, publicKey: null };
  }
  if (!res.ok) {
    throw new Error(`Account query failed (${res.status})`);
  }
  const data = (await res.json()) as {
    account?: {
      account_number?: string;
      sequence?: string;
      pub_key?: { key?: string };
      base_account?: {
        account_number?: string;
        sequence?: string;
        pub_key?: { key?: string };
      };
    };
  };
  const acc = data.account?.base_account ?? data.account;
  const keyB64 = acc?.pub_key?.key;
  let publicKey: Uint8Array | null = null;
  if (keyB64) {
    const binary = atob(keyB64);
    publicKey = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) publicKey[i] = binary.charCodeAt(i);
  }
  return {
    accountNumber: Number(acc?.account_number ?? 0),
    sequence: Number(acc?.sequence ?? 0),
    publicKey,
  };
}

export async function broadcastTx(
  signedTx: Uint8Array,
  lcdBase: string = DEFAULT_LCD_BASE
): Promise<{ txhash: string }> {
  const res = await fetch(lcdPath(lcdBase, '/cosmos/tx/v1beta1/txs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx_bytes: bytesToBase64(signedTx),
      mode: 'BROADCAST_MODE_SYNC',
    }),
  });
  const data = (await res.json()) as {
    tx_response?: {
      txhash?: string;
      code?: number | string;
      raw_log?: string;
      codespace?: string;
    };
  };
  const txhash = data.tx_response?.txhash;
  const code = Number(data.tx_response?.code ?? 0);
  if (!txhash) {
    throw new Error(data.tx_response?.raw_log ?? `Broadcast failed (${res.status})`);
  }
  if (code !== 0) {
    const codespace = data.tx_response?.codespace;
    const detail = data.tx_response?.raw_log ?? `on-chain code ${code}`;
    throw new Error(codespace ? `${codespace}: ${detail}` : detail);
  }
  return { txhash };
}
