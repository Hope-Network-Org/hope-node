/**
 * Run on the host control plane / the node (Node.js), not in the browser.
 *
 * After PayoutWallet calls onPayoutReady(payout):
 *
 *   await applyPayout({ payout, container: 'hope-peer' })
 *
 * Env:
 *   HOPE_OPERATOR_MNEMONIC  24-word hot key on this node (required for sweep)
 *
 * @hopenetwork/wallet/node needs peers @hope/pq and @hope/tx until those are on npm.
 */
import { spawn } from 'node:child_process';
import { signAndBroadcast } from '@hopenetwork/wallet/node';

const CHAIN_ID = 'hope-testnet-2';
const LCD = 'https://test-gateway.hopenetwork.io/api';
const GAS_RESERVE_UHOPE = '100000'; // leave 0.1 HOPE for operator gas

/** Operator-signed MsgUpdateNode. Use this instead of docker when the mnemonic is on this process. */
export async function broadcastUpdateNodePayout(params: {
  mnemonic: string;
  payout: string;
}): Promise<{ txhash: string }> {
  return signAndBroadcast({
    mnemonic: params.mnemonic,
    chainId: CHAIN_ID,
    lcd: LCD,
    messages: [
      {
        typeUrl: '/hope.incentives.v1.MsgUpdateNode',
        value: { payoutRecipient: params.payout },
      },
    ],
    memo: 'update payout recipient',
  });
}

function sh(cmd: string, args: string[]): Promise<{ code: number; out: string; err: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let out = '';
    let err = '';
    child.stdout?.on('data', (d: Buffer) => {
      out += d.toString('utf8');
    });
    child.stderr?.on('data', (d: Buffer) => {
      err += d.toString('utf8');
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, out, err }));
  });
}

export async function updateNodePayout(params: {
  payout: string;
  container?: string;
}): Promise<void> {
  const container = params.container ?? 'hope-peer';
  const result = await sh('docker', [
    'exec',
    container,
    'hoped',
    'tx',
    'incentives',
    'update-node',
    '',
    '--payout-recipient',
    params.payout,
    '--from',
    'operator',
    '--home',
    '/home/hope/.hope',
    '--keyring-backend',
    'test',
    '--chain-id',
    CHAIN_ID,
    '--sign-mode',
    'pq-direct',
    '-y',
  ]);
  if (result.code !== 0) {
    throw new Error(result.err || result.out || 'update-node failed');
  }
}

export async function operatorUhopeBalance(operator: string): Promise<bigint> {
  const res = await fetch(
    `${LCD}/cosmos/bank/v1beta1/balances/${encodeURIComponent(operator)}`
  );
  if (!res.ok) throw new Error(`balance lookup failed (${res.status})`);
  const body = (await res.json()) as {
    balances?: Array<{ denom: string; amount: string }>;
  };
  const coin = body.balances?.find((c) => c.denom === 'uhope');
  return BigInt(coin?.amount ?? '0');
}

/** Send leftover operator rewards to PAYOUT. Skips if nothing above the gas reserve. */
export async function sweepOperatorToPayout(params: {
  operator: string;
  payout: string;
  mnemonic: string;
  reserveUhope?: string;
}): Promise<string | null> {
  const reserve = BigInt(params.reserveUhope ?? GAS_RESERVE_UHOPE);
  const bal = await operatorUhopeBalance(params.operator);
  if (bal <= reserve) return null;
  const amount = (bal - reserve).toString();
  const { txhash } = await signAndBroadcast({
    mnemonic: params.mnemonic,
    chainId: CHAIN_ID,
    lcd: LCD,
    messages: [
      {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: params.operator,
          toAddress: params.payout,
          amount: [{ denom: 'uhope', amount }],
        },
      },
    ],
    memo: 'payout sweep',
  });
  return txhash;
}

export async function applyPayout(params: {
  payout: string;
  operator: string;
  container?: string;
  sweep?: boolean;
}): Promise<{ updateOk: true; sweepTxhash: string | null }> {
  const mnemonic = process.env.HOPE_OPERATOR_MNEMONIC?.trim();
  if (mnemonic) {
    await broadcastUpdateNodePayout({ mnemonic, payout: params.payout });
  } else {
    await updateNodePayout({ payout: params.payout, container: params.container });
  }
  let sweepTxhash: string | null = null;
  if (params.sweep !== false) {
    if (!mnemonic) {
      throw new Error('HOPE_OPERATOR_MNEMONIC is required to sweep operator balances');
    }
    sweepTxhash = await sweepOperatorToPayout({
      operator: params.operator,
      payout: params.payout,
      mnemonic,
    });
  }
  return { updateOk: true, sweepTxhash };
}
