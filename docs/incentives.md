# Incentives

Hope testnet peers can **register for daily native token distributions** from the operator rewards pool when they meet uptime and sync requirements.

View the network on the explorer: [Network analytics](https://explorer.hopenetwork.io/analytics/network)

---

## Enable incentives

Set a valid **BIP-39 24-word mnemonic** in `.env`:

```bash
HOPE_OPERATOR_MNEMONIC="word1 word2 ... word24"
NODE_LABEL=my-peer-name
```

Start the node. **No manual registration scripts required** — the container automates everything when the mnemonic is present.

Optional cold wallet for payouts:

```bash
PAYOUT_RECIPIENT=hope1yourcoldwallet...
```

If `PAYOUT_RECIPIENT` differs from the operator address, authorize once from the cold wallet (outside Docker):

```bash
hoped tx incentives authorize-operator <operator_hope1> \
  --from <cold_wallet> \
  --chain-id hope-testnet-2 \
  --node https://test-gateway.hopenetwork.io/rpc/ \
  --sign-mode pq-direct
```

---

## Automated lifecycle

After sync completes, the container runs:

### 1. Claim peer grant (once)

- **Fee-free** first transaction (`MsgClaimPeerGrant`)
- Module issues a **scoped feegrant** (register, update, sync proof msgs only)
- **Sponsored registration bond** (10 uhope equivalent from incentives module)
- One claim per operator address, ever

### 2. Register node (once)

Records on chain:

- Operator address (`hope1...`)
- CometBFT node ID
- `external_address` (public IP:26656)
- `rpc_url` (public IP:26657)
- Label and payout recipient

### 3. Heartbeat (every 5 minutes)

Keeps `last_heartbeat` fresh. Testnet eligibility uses sync proofs primarily; heartbeats support reliability scoring.

### 4. Sync proof (every 2 hours)

Submits verified block height + app hash. Required for **proof-only** liveness mode on testnet.

---

## Eligibility (testnet)

Current testnet uses **proof-only** liveness (`PEER_LIVENESS_MODE_PROOF_ONLY`). Roughly:

| Requirement | Typical testnet value |
|-------------|----------------------|
| Registered & active | Yes |
| Synced locally | Height within ~50 blocks of gateway |
| Sync-proof healthy hours | ≥ 1 hour in 24h rolling window |
| Height lag vs verified | ≤ 1500 blocks |
| Public P2P + RPC | Reachable on registered endpoints |

Check progress:

```bash
./peer.sh status
```

The status script shows blockers and next steps.

---

## Daily payouts

- **When:** Once per UTC day (chain `BeginBlock`)
- **Pool:** 20% of operator fee pool (`daily_distribution_bps`)
- **Split:** Among eligible nodes by EigenTrust weight × reliability
- **Recipient:** `payout_recipient` on your node record (defaults to operator)

Track payouts on [explorer analytics](https://explorer.hopenetwork.io/analytics/network).

---

## Manual commands (if automation failed)

```bash
./peer.sh register    # Re-run claim + register
./peer.sh heartbeat   # Single heartbeat tx

docker exec hope-peer /usr/local/bin/register-incentives.sh
docker exec hope-peer /usr/local/bin/submit-sync-proof.sh
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh --json | jq .
```

---

## Security

- Operator mnemonic = **hot key** — only signs incentives msgs for your node
- Feegrant cannot be used for bank sends or arbitrary txs
- Grants capped per address and per day on-chain
- Never commit `.env` to git

---

## Related

- [Port forwarding](port-forwarding.md) — required for home eligibility
- [Configuration](configuration.md) — env reference
- [Troubleshooting](troubleshooting.md)
