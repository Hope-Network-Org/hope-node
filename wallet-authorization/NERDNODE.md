# NerdNode — set payout (drop-in)

## 1. Copy this folder

```text
wallet-authorization/   →   your-admin-app/vendor/hope-wallet-authorization/
```

Canonical source also lives at `packages/hope-wallet-authorization` in the Hope monorepo.

## 2. Drop in the React panel

```tsx
import { AuthorizePayoutPanel } from './vendor/hope-wallet-authorization/src/react/AuthorizePayoutPanel';

<AuthorizePayoutPanel
  operatorAddress={workload.operatorHope1}
  origin={{ name: 'NerdNode', url: 'https://www.nerdnode.io' }}
  label="nerdnode"
  containerName="hope-peer"
  onAuthorized={({ payoutAddress, commands }) => {
    // Persist payoutAddress on the workload
    // SSH / agent: run commands.updateNode
    // Optional: commands.bankSendAll or commands.bankSendAmount('1000000')
  }}
/>
```

## 3. After `onAuthorized`

| Step | Action |
|------|--------|
| Update on-chain payout | `commands.updateNode` |
| Move operator tokens (optional) | `commands.bankSendAll` or `commands.bankSendAmount` |
| Persist for re-register | set env `PAYOUT_RECIPIENT=<payoutAddress>` |

## Flow

1. Operator enters cold `hope1…`
2. If ≠ operator → Hope Wallet QR (`MsgAuthorizeOperator`)
3. Customer signs in Hope Wallet with that payout account
4. Panel polls LCD until authorized
5. Your automation runs `update-node` (+ optional `bank send`)

Requires Hope Wallet with authorize-operator support (matching `@hope/tx` update).

See [README.md](./README.md) for headless API details.
