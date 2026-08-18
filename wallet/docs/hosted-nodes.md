# Hosted nodes: connect wallet, change payout, sweep rewards

Copy-paste implementation (React UI + session API + operator update/sweep):

- [`docs/hosted/PayoutWallet.tsx`](hosted/PayoutWallet.tsx) — page that connects Hope Wallet and runs `MsgAuthorizeOperator`
- [`docs/hosted/sessions.ts`](hosted/sessions.ts) — `/api/hope-wallet/sessions` on the same HTTPS origin
- [`docs/hosted/applyPayout.ts`](hosted/applyPayout.ts) — `MsgUpdateNode` + `MsgSend` sweep from the node (not the browser)

For any host (managed hardware, VPS, or your own panel).

```bash
npm install @hopenetwork/wallet
```

React UI: `@hopenetwork/wallet/react`. Live shape: the Hope Wallet playground (`hope-wallet-playground`).

Do **not** collect the customer’s 24-word phrase. That stays in Hope Wallet. You keep only the **operator** mnemonic on the machine (`HOPE_OPERATOR_MNEMONIC`).

| Role | Who holds the key | Address | Signs |
|------|-------------------|---------|--------|
| Operator (hot) | Host, on the node | `OPERATOR` | Register, sync proofs, `MsgUpdateNode`, sweep `MsgSend` |
| Payout (cold) | Customer, Hope Wallet | `PAYOUT` | `connect()`, `MsgAuthorizeOperator` |

Changing `.env` / `PAYOUT_RECIPIENT` does **not** move an already-registered node. On-chain `payout_recipient` is what daily rewards use.

`MsgAuthorizeOperator` cannot authorize yourself (`PAYOUT === OPERATOR` fails with `ErrSelfAuthorization`). Skip authorize when they want rewards at the operator address.

Chain: `hope-testnet-2`. LCD: `https://test-gateway.hopenetwork.io/api`.

---

## 1. Connect Hope Wallet (get `PAYOUT`)

HTTPS origin only (`http` is allowed on `localhost` for local tests).

### Browser

```ts
import { connect, createHttpTransport } from '@hopenetwork/wallet';
import { VerifyWalletPanel } from '@hopenetwork/wallet/react';

const origin = { name: 'Your host', url: window.location.origin };
const transport = createHttpTransport({
  baseUrl: `${origin.url}/api/hope-wallet`,
});

// QR / in-app overlay
<VerifyWalletPanel
  origin={origin}
  chainId="hope-testnet-2"
  transport={transport}
  relayUrl={true}
  onVerified={({ address }) => setPayout(address)}
/>

// or without React:
const { address: payout } = await connect({
  origin,
  chainId: 'hope-testnet-2',
  transport,
  relayUrl: true,
});
```

`relayUrl: true` makes Hope Wallet POST the proof to  
`{origin}/api/hope-wallet/sessions/{id}/confirm`. The phone cannot reach your laptop; production must be public HTTPS.

### Session API (same origin)

Implement these four routes. Store rows in memory, Redis, or a DB. TTL 5 minutes.

**`POST /api/hope-wallet/sessions`**

Body is the connect payload from the SDK (`session_id`, `origin`, `expires_at`, …). Create a row:

```json
{
  "session_id": "cs_…",
  "status": "pending",
  "address": null,
  "pubkey_base64": null,
  "account_label": null,
  "connected_at": null
}
```

**`GET /api/hope-wallet/sessions/:id`** — return that row (`404` if missing).

**`DELETE /api/hope-wallet/sessions/:id`** — set `status` to `cancelled`.

**`POST /api/hope-wallet/sessions/:id/confirm`** — Hope Wallet calls this (no cookies). Body:

```json
{
  "session_id": "cs_…",
  "address": "hope1…",
  "pubkey_base64": "…",
  "account_label": "optional"
}
```

Validate with `parseWalletProof`, require `session_id` to match, then set `status: "connected"` and the address fields. Reject if expired or already cancelled.

The SDK polls `GET` until `status === "connected"`.

---

## 2. Authorize the operator (customer signs in Hope Wallet)

Required when `PAYOUT ≠ OPERATOR` before register or before `MsgUpdateNode` with a new recipient.

Signer **must** be the payout wallet. The SDK/wallet overwrites `payoutRecipient` to the connected account.

```tsx
import { MessagePanel } from '@hopenetwork/wallet/react';

<MessagePanel
  origin={origin}
  chainId="hope-testnet-2"
  account={payout}
  title="Authorize node"
  preview={{
    title: 'Authorize node',
    summary: 'Allow this hosted node to send rewards to this Hope Wallet',
  }}
  messages={[
    {
      typeUrl: '/hope.incentives.v1.MsgAuthorizeOperator',
      value: {
        payoutRecipient: payout,
        operator: OPERATOR, // hope1 of the hot key on that machine
        label: 'hosted',
      },
    },
  ]}
  onComplete={(r) => {
    if (r.mode === 'in-app') console.log('tx', r.txhash);
    // camera QR: wallet broadcasts; look up on Explorer
  }}
/>
```

If they already authorized this pair, the chain returns `ErrAuthorizationExists` — treat as success and continue.

Optional revoke (same signer): type URL `/hope.incentives.v1.MsgRevokeOperatorAuthorization` with `{ payoutRecipient, operator }`.

---

## 3. Point the node at that payout (operator signs on the box)

`MsgUpdateNode` signer is **operator**, not the customer. Feegrant on the operator **does** cover this incentives message.

After step 2 succeeds, on that node:

```bash
docker exec hope-peer hoped tx incentives update-node "" \
  --payout-recipient "$PAYOUT" \
  --from operator \
  --home /home/hope/.hope \
  --keyring-backend test \
  --chain-id hope-testnet-2 \
  --sign-mode pq-direct \
  -y
```

Also set `PAYOUT_RECIPIENT=$PAYOUT` in the container env so future automation matches chain.

Empty `payout_recipient` on `MsgUpdateNode` means “leave unchanged”. Changing it **requires** the authorization from step 2. Empty `label` (the `""` in `update-node ""`) also means leave the label unchanged. There is no `nodeId` field on this message.

Same tx from Node (never the webpage). `operator` is overwritten to the mnemonic address:

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

`hoped` in the container still works if you do not have `@hope/pq` + `@hope/tx` on the control plane.

### New subscription

1. Generate `HOPE_OPERATOR_MNEMONIC` on the machine (never the customer’s).
2. Connect (step 1) → `PAYOUT`.
3. If `PAYOUT !== OPERATOR`, authorize (step 2).
4. Start the peer with `HOPE_OPERATOR_MNEMONIC` + `PAYOUT_RECIPIENT=$PAYOUT`. First register picks up that recipient.

### Existing node (already registered)

1. Connect new Hope Wallet → `PAYOUT`.
2. Authorize that address for this `OPERATOR` (step 2).
3. `update-node --payout-recipient` (this section).
4. Optional: sweep old operator balances (step 4).

---

## 4. Send existing operator rewards to the payout wallet

Daily incentives already go to on-chain `payout_recipient`. Coins that **already sit on the operator address** (older payouts, leftover HOPE) do **not** move with `update-node`. Send them with `MsgSend`.

Signer is the **operator**. Chain **feegrant cannot pay for bank sends** — the operator account must hold enough `uhope` to cover amount + fee (~100 uhope buffer is safe).

Query:

```
GET https://test-gateway.hopenetwork.io/api/cosmos/bank/v1beta1/balances/{OPERATOR}
```

Then from a **Node** process (never a webpage), using the operator mnemonic already on the box:

```ts
import { signAndBroadcast } from '@hopenetwork/wallet/node';

const { txhash } = await signAndBroadcast({
  mnemonic: process.env.HOPE_OPERATOR_MNEMONIC!,
  chainId: 'hope-testnet-2',
  lcd: 'https://test-gateway.hopenetwork.io/api',
  messages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: OPERATOR, // overwritten to the mnemonic address
        toAddress: PAYOUT,
        amount: [{ denom: 'uhope', amount: sweepUhope }], // integer string, 1 HOPE = 1_000_000
      },
    },
  ],
  memo: 'payout sweep',
});
```

`./node` needs peers `@hope/pq` and `@hope/tx` (not on npm yet). Until they are published, use the same `file:` packages as Hope Wallet, or run the container helper:

```bash
# PQ bank send (plain `hoped tx bank send` is not PQ-safe)
docker exec hope-peer hoped tx bank send operator "$PAYOUT" "${sweepUhope}uhope" \
  --home /home/hope/.hope \
  --keyring-backend test \
  --chain-id hope-testnet-2 \
  --sign-mode pq-direct \
  -y
```

If `hoped tx bank send` fails on signature mode, use the chain repo’s `hope-bank-send` tool or `signAndBroadcast` above.

Do not sweep the entire balance to zero if the operator still needs gas for proofs; leave a small `uhope` reserve.

---

## Order (existing node, new payout)

1. `connect()` → `PAYOUT`
2. Customer signs `MsgAuthorizeOperator`
3. Operator broadcasts `MsgUpdateNode` with `--payout-recipient`
4. Operator `MsgSend` leftover `uhope` from `OPERATOR` → `PAYOUT`
5. Persist `PAYOUT_RECIPIENT` on the box

## Security

- Never log mnemonics. Never import `@hopenetwork/wallet/node` in a frontend bundle.
- Confirm URL must be HTTPS and the same origin as the page.
- `connect` and `message` payloads are not interchangeable.
- Operator key stays on the node; payout key stays in Hope Wallet.
