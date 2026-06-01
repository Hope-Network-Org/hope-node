# Configuration

Environment variables for `docker-compose.yml` / `.env`.

## Image

| Variable | Default | Description |
|----------|---------|-------------|
| `HOPE_PEER_IMAGE` | `public.ecr.aws/r8k0t0l9/hope-peer:testnet` | Docker image |
| `DOCKER_PLATFORM` | *(empty)* | Set `linux/amd64` on Apple Silicon |

---

## Chain (usually leave default)

| Variable | Default | Description |
|----------|---------|-------------|
| `CHAIN_ID` | `hope-testnet-2` | Chain identifier |
| `MONIKER` | `hope-peer` | Node name in logs |
| `CHAIN_METADATA_URL` | `https://test-gateway.hopenetwork.io/chain.json` | Seeds, genesis URL |
| `STATE_SYNC` | `true` | Fast bootstrap via state sync |
| `FORCE_STATE_SYNC` | `false` | Wipe block store and state-sync on start |
| `STATE_SYNC_RPC` | `3.21.91.67:26657` | Host:port RPC with snapshots (not HTTPS `/rpc`) |
| `STATE_SYNC_RPC_URL` | gateway HTTPS `/rpc` | Used for trust height/hash lookup |
| `SEEDS` | *(from chain.json)* | Comma-separated seed nodes |
| `PERSISTENT_PEERS` | *(from chain.json)* | Persistent validator peers |

State sync needs a reachable **host:port** CometBFT RPC (26657). The HTTPS gateway URL is used for status queries only. If first boot hangs at height 0, set `STATE_SYNC_RPC=3.21.91.67:26657` and run `./peer.sh resync`.

Override peers only if directed by Hope Network ops.

---

## Network endpoints

| Variable | Default | Description |
|----------|---------|-------------|
| `EXTERNAL_ADDRESS` | auto | Public `IP:26656` for P2P |
| `AUTO_DETECT_EXTERNAL_ADDRESS` | `true` | Detect public IP on start |
| `RPC_URL` | derived | Public `http://IP:26657` for on-chain record |

On VPS, auto-detect usually works. At home, set manually after port-forward:

```bash
EXTERNAL_ADDRESS=203.0.113.10:26656
RPC_URL=http://203.0.113.10:26657
```

---

## Incentives

| Variable | Default | Description |
|----------|---------|-------------|
| `HOPE_OPERATOR_MNEMONIC` | *(empty)* | **24-word BIP-39** — enables full automation when set |
| `PAYOUT_RECIPIENT` | operator | Cold wallet for daily rewards |
| `NODE_LABEL` | `docker-peer` | Display name on explorer |

When `HOPE_OPERATOR_MNEMONIC` is set, these are **automatically enabled** inside the container (do not set to `false`):

- `AUTO_REGISTER_INCENTIVES`
- `AUTO_CLAIM_PEER_GRANT`
- `AUTO_SYNC_PROOF`
- `AUTO_UPDATE_ENDPOINTS`

Testnet eligibility is **sync-proof only** — heartbeats are not used. `AUTO_HEARTBEAT` defaults to `false` and should stay off.

Optional tuning:

| Variable | Default | Description |
|----------|---------|-------------|
| `SYNC_PROOF_INTERVAL_SEC` | `7200` | Sync proof every 2 h (matches chain `sync_proof_min_interval`) |
| `AUTO_HEARTBEAT` | `false` | Legacy; not required on current testnet |

---

## Advanced

| Variable | Default | Description |
|----------|---------|-------------|
| `HOPE_TX_NODE` | local after sync | RPC for broadcasting txs |
| `HOPE_API_URL` | test-gateway API | Used by status scripts |

---

## Example `.env` files

**Sync only:**

```bash
HOPE_PEER_IMAGE=public.ecr.aws/r8k0t0l9/hope-peer:testnet
MONIKER=my-peer
```

**Home incentives:**

```bash
HOPE_PEER_IMAGE=public.ecr.aws/r8k0t0l9/hope-peer:testnet
DOCKER_PLATFORM=linux/amd64
HOPE_OPERATOR_MNEMONIC="..."
NODE_LABEL=home-office-peer
EXTERNAL_ADDRESS=203.0.113.10:26656
RPC_URL=http://203.0.113.10:26657
```

**VPS incentives (minimal):**

```bash
HOPE_OPERATOR_MNEMONIC="..."
NODE_LABEL=vps-frankfurt-1
STATE_SYNC_RPC=3.21.91.67:26657
# EXTERNAL_ADDRESS auto-detected
```

Copy from [.env.example](../.env.example) — never commit `.env`.
