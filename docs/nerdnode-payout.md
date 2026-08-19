# NerdNode: Hope Wallet payout (new + existing nodes)

**Do not collect the customer’s 24-word phrase.** NerdNode keeps `HOPE_OPERATOR_MNEMONIC` on the box. The customer’s [Hope Wallet](https://play.google.com/store/apps/details?id=io.hopenetwork.wallet) is only the **payout** address.

```bash
npm install @hopenetwork/wallet
```

Package: https://www.npmjs.com/package/@hopenetwork/wallet  
Chain: `hope-testnet-2` · LCD: `https://test-gateway.hopenetwork.io/api`

| Address | Who | What |
|---------|-----|------|
| `OPERATOR` | You (hot key on the node) | Docker, sync proofs, `update-node`, sweep |
| `PAYOUT` | Customer (Hope Wallet) | `connect()` + `MsgAuthorizeOperator` |

Changing env on a **already registered** node does nothing until `update-node` is broadcast.

If `PAYOUT === OPERATOR`, skip authorize (`ErrSelfAuthorization`). If authorize was already done for that pair, `ErrAuthorizationExists` — continue.

---

## 1. Session API (same HTTPS origin as the page)

Phone-camera connect POSTs to `{origin}/api/hope-wallet/sessions/{id}/confirm`. Mount this on nerdnode.io (or the panel origin).

```ts
// hopeWalletSessions.ts
import type { IncomingMessage, ServerResponse } from 'node:http';

type Row = {
  session_id: string;
  status: 'pending' | 'connected' | 'cancelled';
  address: string | null;
  pubkey_base64: string | null;
  account_label: string | null;
  connected_at: string | null;
  expires_at: string;
};

const sessions = new Map<string, Row>();

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

export async function handleHopeWalletSessions(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  if (!url.pathname.startsWith('/api/hope-wallet')) return next();

  const method = req.method ?? 'GET';
  try {
    if (method === 'POST' && url.pathname === '/api/hope-wallet/sessions') {
      const body = (await readJson(req)) as { session_id?: string; expires_at?: string };
      const id = body.session_id?.trim();
      if (!id) return json(res, 400, { error: 'session_id is required' });
      sessions.set(id, {
        session_id: id,
        status: 'pending',
        address: null,
        pubkey_base64: null,
        account_label: null,
        connected_at: null,
        expires_at: body.expires_at ?? new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });
      return json(res, 200, { ok: true, session_id: id });
    }

    const m = url.pathname.match(/^\/api\/hope-wallet\/sessions\/([^/]+)(?:\/(confirm))?$/);
    if (!m) return json(res, 404, { error: 'unknown route' });
    const id = decodeURIComponent(m[1]);
    const confirm = m[2] === 'confirm';
    const row = sessions.get(id);

    if (method === 'GET' && !confirm) {
      return row ? json(res, 200, row) : json(res, 404, { error: 'not found' });
    }
    if (method === 'DELETE' && !confirm) {
      if (row) row.status = 'cancelled';
      return json(res, 200, { ok: true });
    }
    if (method === 'POST' && confirm) {
      if (!row || row.status === 'cancelled') return json(res, 404, { error: 'session not found' });
      const body = (await readJson(req)) as Record<string, unknown>;
      const address = String(body.address ?? '').trim();
      if (!address.startsWith('hope1')) return json(res, 400, { error: 'invalid address' });
      row.status = 'connected';
      row.address = address;
      row.pubkey_base64 = (body.pubkey_base64 as string) || (body.pubkeyBase64 as string) || null;
      row.account_label = (body.account_label as string) || (body.accountLabel as string) || null;
      row.connected_at = new Date().toISOString();
      return json(res, 200, { ok: true });
    }
    json(res, 405, { error: 'method not allowed' });
  } catch (e) {
    json(res, 400, { error: e instanceof Error ? e.message : 'error' });
  }
}

// Express / connect / http:
// app.use((req, res, next) => { void handleHopeWalletSessions(req, res, next); });
```

Use Redis instead of `Map` if you have more than one app server.

---

## 2. Page: connect + authorize (customer)

```tsx
import { useMemo, useState } from 'react';
import { createHttpTransport } from '@hopenetwork/wallet';
import { MessagePanel, VerifyWalletPanel } from '@hopenetwork/wallet/react';

const CHAIN_ID = 'hope-testnet-2';

export function HopePayoutSetup(props: {
  operatorAddress: string; // hope1 of THIS node's HOPE_OPERATOR_MNEMONIC
  onReady: (payout: string) => Promise<void>;
}) {
  const origin = useMemo(
    () => ({ name: 'NerdNode', url: window.location.origin }),
    []
  );
  const transport = useMemo(
    () => createHttpTransport({ baseUrl: `${window.location.origin}/api/hope-wallet` }),
    []
  );
  const [payout, setPayout] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const same =
    payout && payout.toLowerCase() === props.operatorAddress.toLowerCase();

  const finish = async (addr: string) => {
    await props.onReady(addr);
    setDone(true);
  };

  if (done && payout) return <p>Payout set to {payout}</p>;

  if (!payout) {
    return (
      <VerifyWalletPanel
        origin={origin}
        chainId={CHAIN_ID}
        transport={transport}
        relayUrl={true}
        title="Connect Hope Wallet"
        description="Rewards will go to this address."
        onVerified={(p) => setPayout(p.address)}
      />
    );
  }

  if (same) {
    return (
      <button type="button" onClick={() => void finish(payout)}>
        Use operator address
      </button>
    );
  }

  return (
    <MessagePanel
      origin={origin}
      chainId={CHAIN_ID}
      account={payout}
      title="Authorize this node"
      preview={{
        title: 'Authorize node',
        summary: 'Allow this NerdNode to send rewards to this Hope Wallet',
      }}
      messages={[
        {
          typeUrl: '/hope.incentives.v1.MsgAuthorizeOperator',
          value: {
            payoutRecipient: payout,
            operator: props.operatorAddress,
            label: 'nerdnode',
          },
        },
      ]}
      onComplete={() => void finish(payout)}
    />
  );
}
```

`onReady` should `POST` `{ payout }` to your backend for this subscription/node. **Never import `@hopenetwork/wallet/node` in the browser.**

Authorize message (customer signs in Hope Wallet):

| | |
|--|--|
| Type | `/hope.incentives.v1.MsgAuthorizeOperator` |
| Signer | `payoutRecipient` (connected Hope Wallet) |
| `operator` | NerdNode hot-key `hope1` for that machine |

---

## 3. New node (Docker)

After `onReady(payout)`:

```bash
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e FORCE_STATE_SYNC=true \
  -e STATE_SYNC=true \
  -e STATE_SYNC_RPC=3.21.91.67:26657 \
  -e HOPE_OPERATOR_MNEMONIC="twenty four words you generated" \
  -e PAYOUT_RECIPIENT="hope1…from connect" \
  -e NODE_LABEL=customer-label \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

Generate `HOPE_OPERATOR_MNEMONIC` yourselves. Authorize (step 2) **before** first register if `PAYOUT_RECIPIENT` ≠ operator.

Image: `public.ecr.aws/r8k0t0l9/hope-peer:testnet`

---

## 4. Existing node — change payout on chain

After the same connect + authorize for the **new** Hope address:

```bash
# Point daily rewards at PAYOUT (signer = operator on the box)
docker exec hope-peer hoped tx incentives update-node "" \
  --payout-recipient "$PAYOUT" \
  --from operator \
  --home /home/hope/.hope \
  --keyring-backend test \
  --chain-id hope-testnet-2 \
  --sign-mode pq-direct \
  -y
```

On-chain msg: `/hope.incentives.v1.MsgUpdateNode`  
Signer: `operator` · field `payout_recipient` = `$PAYOUT`  
Requires the authorize tx first. Persist `PAYOUT_RECIPIENT` in that container’s env too.  
`update-node ""` is an empty **label** (leave label unchanged). This message has no `nodeId` field.

Same tx on the box with the operator mnemonic (never the webpage):

```ts
import { signAndBroadcast } from '@hopenetwork/wallet/node';

await signAndBroadcast({
  mnemonic: process.env.HOPE_OPERATOR_MNEMONIC!,
  chainId: 'hope-testnet-2',
  lcd: 'https://test-gateway.hopenetwork.io/api',
  messages: [
    {
      typeUrl: '/hope.incentives.v1.MsgUpdateNode',
      value: {
        payoutRecipient: PAYOUT,
      },
    },
  ],
  memo: 'update payout recipient',
});
```

---

## 5. Sweep HOPE already on the operator address

Future daily rewards follow `payout_recipient` after step 4. Coins **already** on `OPERATOR` need a bank send. Feegrant **cannot** pay this. Leave a gas reserve (~`100000` uhope).

```bash
docker exec hope-peer hoped tx bank send operator "$PAYOUT" "${AMOUNT}uhope" \
  --home /home/hope/.hope \
  --keyring-backend test \
  --chain-id hope-testnet-2 \
  --sign-mode pq-direct \
  -y
```

Balance:

`GET https://test-gateway.hopenetwork.io/api/cosmos/bank/v1beta1/balances/{OPERATOR}`

Same send via JS on the **node** (not the webpage):

```ts
import { signAndBroadcast } from '@hopenetwork/wallet/node';

await signAndBroadcast({
  mnemonic: process.env.HOPE_OPERATOR_MNEMONIC!,
  chainId: 'hope-testnet-2',
  lcd: 'https://test-gateway.hopenetwork.io/api',
  messages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: OPERATOR,
        toAddress: PAYOUT,
        amount: [{ denom: 'uhope', amount: AMOUNT }], // 1 HOPE = 1000000
      },
    },
  ],
  memo: 'payout sweep',
});
```

`./node` needs `@hope/pq` + `@hope/tx` (not on npm yet). Prefer `hoped` in Docker until those are published.

---

## Order

**New:** connect → authorize (if needed) → `docker run` with `PAYOUT_RECIPIENT`.

**Change:** connect → authorize → `update-node --payout-recipient` → optional `bank send`.
