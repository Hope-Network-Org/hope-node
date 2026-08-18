import {
  deriveAddressFromMnemonic,
  keypairFromMnemonic,
  signSignDoc,
} from '@hope/pq';
import {
  buildAuthInfo,
  buildSignDocBytes,
  buildTxBody,
  buildTxRawBytes,
} from '@hope/tx';
import { DEFAULT_CHAIN_ID } from '../payload';
import { assertHopeMnemonic } from '../mnemonic';
import type { WalletMessage } from '../signPayload';
import { DEFAULT_LCD_BASE, broadcastTx, fetchChainAccount } from './chain';
import { encodeWalletMessage } from './encode';

const DEFAULT_TX_GAS = 700_000;
const GAS_PER_EXTRA_MESSAGE = 200_000;
const FIRST_PUBKEY_GAS = 200_000;
const GAS_PRICE_UHOPE = 0.0001;

function assertNotBrowser(): void {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    throw new Error(
      'signAndBroadcast cannot run in a browser. Use connect() / message() so keys stay in Hope Wallet.'
    );
  }
}

function pubkeysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Sign with a Hope PQ mnemonic (ML-DSA-65) and broadcast.
 * Server / node / scripts only. Never pass a mnemonic into a webpage.
 */
export async function signAndBroadcast(params: {
  mnemonic: string;
  passphrase?: string;
  accountIndex?: number;
  chainId?: string;
  lcd?: string;
  messages: WalletMessage[];
  memo?: string;
  fee?: { amount?: string; denom?: string; gas?: string };
}): Promise<{ address: string; txhash: string }> {
  assertNotBrowser();
  if (!params.messages.length) throw new Error('At least one message is required');

  const mnemonic = assertHopeMnemonic(params.mnemonic);
  const passphrase = params.passphrase ?? '';
  const accountIndex = params.accountIndex ?? 0;
  const chainId = params.chainId?.trim() || DEFAULT_CHAIN_ID;
  const lcd = params.lcd?.trim() || DEFAULT_LCD_BASE;

  const address = deriveAddressFromMnemonic(mnemonic, passphrase, accountIndex);
  const { publicKey } = keypairFromMnemonic(mnemonic, passphrase, accountIndex);
  const account = await fetchChainAccount(address, lcd);

  if (account.publicKey && !pubkeysEqual(account.publicKey, publicKey)) {
    throw new Error(
      'Mnemonic does not match the public key on chain for this address'
    );
  }

  const encoded = params.messages.map((m) => encodeWalletMessage(m, address));
  const extraGas = Math.max(0, encoded.length - 1) * GAS_PER_EXTRA_MESSAGE;
  const firstKeyGas = account.publicKey ? 0 : FIRST_PUBKEY_GAS;
  const gasLimit = Number(params.fee?.gas ?? DEFAULT_TX_GAS + extraGas + firstKeyGas);
  const feeAmount =
    params.fee?.amount ?? String(Math.ceil(gasLimit * GAS_PRICE_UHOPE));
  const feeDenom = params.fee?.denom ?? 'uhope';

  const bodyBytes = buildTxBody(encoded, params.memo ?? '');
  const authInfoBytes = buildAuthInfo({
    publicKey,
    sequence: account.sequence,
    gasLimit,
    feeDenom,
    feeAmount,
  });
  const signDocBytes = buildSignDocBytes({
    bodyBytes,
    authInfoBytes,
    chainId,
    accountNumber: account.accountNumber,
  });
  const signature = signSignDoc(signDocBytes, mnemonic, passphrase, accountIndex);
  const signedTx = buildTxRawBytes({ bodyBytes, authInfoBytes, signature });
  const { txhash } = await broadcastTx(signedTx, lcd);
  return { address, txhash };
}

export function addressFromMnemonic(
  mnemonic: string,
  passphrase = '',
  accountIndex = 0
): string {
  assertNotBrowser();
  return deriveAddressFromMnemonic(
    assertHopeMnemonic(mnemonic),
    passphrase,
    accountIndex
  );
}
