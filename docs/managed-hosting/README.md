# Managed hosting integration

Offer the official **`hope-peer:testnet`** image per customer: public **26656** / **26657**, **incentives** registration, and **Hope Wallet** payout connect on your panel.

| Key | Who holds it |
|-----|----------------|
| `HOPE_OPERATOR_MNEMONIC` | You (hot key on the server) |
| Payout `hope1…` | Customer (Hope Wallet — **never** their 24-word seed) |

## Build order

| # | Topic | Doc |
|---|--------|-----|
| 1 | Provision peer | [Quick start](../quick-start.md) |
| 2 | Rewards & sync proofs | [Incentives](../incentives.md) |
| 3 | Connect + payout UX | [hosted-nodes.md](../../wallet/docs/hosted-nodes.md) |
| 4 | Agent implementation | [ai-agent-prompt.md](ai-agent-prompt.md) |

**Copy prompt:** [node.hopenetwork.io/#managed-hosting](https://node.hopenetwork.io/#managed-hosting) (`{{PROVIDER_NAME}}`, `{{PANEL_ORIGIN}}`)

**Samples:** `wallet/docs/hosted/` · [payout walkthrough](../nerdnode-payout.md)

`hope-testnet-2` · LCD `https://test-gateway.hopenetwork.io/api` · [Registered nodes](https://explorer.hopenetwork.io/analytics/network)
