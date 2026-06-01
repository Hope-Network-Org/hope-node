# How it works

## Overview

A Hope peer is a **non-validator full node** running `hoped` (Hope's Cosmos SDK chain binary). It:

1. Downloads genesis and chain config from [chain.json](https://test-gateway.hopenetwork.io/chain.json)
2. Connects to seeds and validator peers over P2P
3. **State-syncs** to near chain head (fast first boot)
4. Serves RPC on port **26657** and P2P on **26656**

The published Docker image bundles a `hoped` binary matched to testnet validators (same AppHash).

```
┌─────────────────────────────────────────────────────────┐
│  Docker container (hope-peer)                           │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │ entrypoint  │──▶│ hoped (sync) │──▶│ local RPC   │ │
│  └─────────────┘   └──────────────┘   │ :26657      │ │
│         │                              └─────────────┘ │
│         │ if HOPE_OPERATOR_MNEMONIC set                  │
│         ▼                                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │ incentives automation (background)               │  │
│  │  claim grant → register → sync proof (every 2h)  │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
          │ P2P :26656              │ HTTPS
          ▼                         ▼
   Other Hope peers          test-gateway.hopenetwork.io
```

---

## First boot sequence

1. **Init** — create `config.toml`, node key, operator keyring (if mnemonic provided)
2. **Genesis** — fetch from URL in chain metadata; reset local DB if genesis changed
3. **Peers** — load seeds + persistent peers from chain.json (validator fallback if seed P2P is slow)
4. **State sync** — snapshot via `STATE_SYNC_RPC` host:port (default gateway `3.21.91.67:26657`)
5. **Public IP** — auto-detect via cloud metadata or ipify (when `AUTO_DETECT_EXTERNAL_ADDRESS=true`)
6. **Start hoped** — block sync / live sync to head

Data persists in Docker volume `hope-peer-data`. Restarts **resume from disk** without re-syncing unless you run `./peer.sh resync`.

---

## Incentives automation

When `HOPE_OPERATOR_MNEMONIC` is set, the entrypoint enables full automation (no extra env flags needed):

| Step | When | What |
|------|------|------|
| Import key | Start | PQ operator key in container keyring |
| Wait for sync | After RPC up | Height > 1000, drift ≤ 50 blocks |
| Claim peer grant | Once | Fee-free tx; module feegrant + sponsored bond |
| Register node | Once | On-chain record with label, node ID, endpoints |
| Sync proof | Every 2 h | Proves local height matches chain (eligibility + reliability) |
| Update endpoints | If needed | Fixes loopback RPC on chain record |

Testnet uses **proof-only** liveness — the container does **not** send heartbeat transactions.

Incentive transactions broadcast via **local RPC** once synced (reliable; avoids gateway mempool edge cases).

Effective flags are stored in `/home/hope/.hope/config/.automation.env` inside the container.

---

## Where rewards come from

- Network transaction fees split: **40%** to operator pool, **40%** stakers, **20%** burned
- **Daily distribution** (UTC midnight): eligible peers share operator pool proportional to trust weight and reliability
- Explorer: [Network analytics](https://explorer.hopenetwork.io/analytics/network)

---

## What you control vs what is automatic

| You provide | Container handles |
|-------------|-------------------|
| Docker + ports | Genesis, peers, state sync |
| Mnemonic (incentives) | Grant claim, registration |
| Optional cold payout address | Sync proofs every 2 h |
| Router port-forward (home) | IP detection, endpoint updates |

---

## Related

- [Peer node](peer-node.md)
- [Incentives](incentives.md)
- [Configuration](configuration.md)
