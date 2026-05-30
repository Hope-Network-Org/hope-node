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
| `SEEDS` | *(from chain.json)* | Comma-separated seed nodes |
| `PERSISTENT_PEERS` | *(from chain.json)* | Persistent validator peers |

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
- `AUTO_HEARTBEAT`
- `AUTO_SYNC_PROOF`
- `AUTO_UPDATE_ENDPOINTS`

Optional tuning (defaults shown):

| Variable | Default | Description |
|----------|---------|-------------|
| `HEARTBEAT_INTERVAL_SEC` | `300` | Heartbeat every 5 min |
| `SYNC_PROOF_INTERVAL_SEC` | `7200` | Sync proof every 2 h |

---

## Advanced

| Variable | Default | Description |
|----------|---------|-------------|
| `FORCE_STATE_SYNC` | `false` | Force state sync on restart |
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
# EXTERNAL_ADDRESS auto-detected
```

Copy from [.env.example](../.env.example) — never commit `.env`.
