# `@hope/wallet-authorization`

Drop-in module for **NerdNode** (or any host panel) to change a Hope peer’s payout wallet with Hope Wallet QR — no CLI for the cold-wallet authorize step.

## What it does

1. If **payout == operator** → skip authorize  
2. Else → build `hopewallet://sign` QR for `MsgAuthorizeOperator`  
3. User signs in **Hope Wallet** with the cold payout account  
4. Module **polls LCD** until authorization is on-chain  
5. Returns the confirmed `payoutAddress` + **host CLI** for:
   - `update-node --payout-recipient …`
   - optional `bank send` of operator balances to that wallet

## Install / drop-in

Copy this folder into your app (or add as a workspace package):

```text
packages/hope-wallet-authorization/
```

```ts
import {
  preparePayoutSetup,
  completePayoutAuthorization,
  buildHostFollowUpCommands,
} from '@hope/wallet-authorization';

// React UI (optional)
import { AuthorizePayoutPanel } from '@hope/wallet-authorization/react';
```

Requires **Hope Wallet** builds that encode `MsgAuthorizeOperator` (shipped with the matching `@hope/tx` update).

## React drop-in

```tsx
import { AuthorizePayoutPanel } from '@hope/wallet-authorization/react';

<AuthorizePayoutPanel
  operatorAddress={node.operatorAddress}
  origin={{ name: 'NerdNode', url: 'https://www.nerdnode.io' }}
  label="nerdnode"
  containerName="hope-peer"
  onAuthorized={({ payoutAddress, commands }) => {
    // 1) Persist payoutAddress on the workload
    // 2) Run commands.updateNode on the host (SSH / agent)
    // 3) Optionally run commands.bankSendAll or commands.bankSendAmount('1000000')
    console.log(payoutAddress, commands.updateNode);
  }}
/>
```

## Headless API

```ts
const session = await preparePayoutSetup({
  operatorAddress: 'hope1operator…',
  payoutAddress: 'hope1cold…',
  origin: { name: 'NerdNode', url: 'https://www.nerdnode.io' },
});

if (session.phase === 'awaiting_wallet') {
  // show session.qrUrl / session.deepLink
  const { commands } = await completePayoutAuthorization({
    payoutAddress: session.payoutAddress,
    operatorAddress: session.operatorAddress,
  });
  // run commands.updateNode (+ bank send) on the peer host
}
```

## Host follow-up (after QR success)

```bash
# Update on-chain payout (operator key inside container)
docker exec hope-peer hoped tx incentives update-node "" \
  --payout-recipient hope1cold… \
  --from operator --home /home/hope/.hope --keyring-backend test \
  --chain-id hope-testnet-2 --node tcp://127.0.0.1:26657 \
  --sign-mode pq-direct --gas auto --gas-adjustment 1.5 \
  --gas-prices 0.0001uhope -y

# Optional: move tokens from operator → new payout
docker exec hope-peer hoped tx bank send operator hope1cold… <amount>uhope \
  --from operator --home /home/hope/.hope --keyring-backend test \
  --chain-id hope-testnet-2 --node tcp://127.0.0.1:26657 \
  --sign-mode pq-direct --gas auto --gas-adjustment 1.5 \
  --gas-prices 0.0001uhope -y
```

Also set `PAYOUT_RECIPIENT=hope1cold…` in the workload env for future re-registers.

## LCD check

```text
GET https://test-gateway.hopenetwork.io/api/hope/incentives/v1/operator_authorizations/{payout}
```

## Defaults

| Constant | Value |
|----------|--------|
| Chain ID | `hope-testnet-2` |
| LCD | `https://test-gateway.hopenetwork.io/api` |
| Type URL | `/hope.incentives.v1.MsgAuthorizeOperator` |
