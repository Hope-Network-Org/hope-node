# Commands & tooling

## `peer.sh` (recommended)

Run from the repo root after `chmod +x peer.sh`.

| Command | Description |
|---------|-------------|
| `./peer.sh up` | Pull image (if needed) and start container |
| `./peer.sh down` | Stop and remove container (keeps volume) |
| `./peer.sh restart` | Recreate container, resume from disk |
| `./peer.sh pull` | Pull latest published image |
| `./peer.sh upgrade` | Pull latest + restart + verify |
| `./peer.sh fresh` | **Delete volume** + pull + start (clean slate) |
| `./peer.sh logs` | Follow container logs |
| `./peer.sh status` | Sync + incentives eligibility dashboard |
| `./peer.sh verify` | Health check: sync, drift, AppHash, ports |
| `./peer.sh ports` | Print LAN/public IP + router guide |
| `./peer.sh upnp` | Try UPnP port mapping (optional) |
| `./peer.sh resync` | Wipe blocks + state-sync (fix AppHash) |
| `./peer.sh reset` | Wipe blocks, blocksync from genesis |
| `./peer.sh register` | Manual incentives registration |
| `./peer.sh heartbeat` | Send one heartbeat transaction |
| `./peer.sh shell` | Interactive bash inside container |

---

## Docker Compose

```bash
docker compose --env-file .env up -d
docker compose logs -f hope-peer
docker compose down
docker compose pull && docker compose up -d --force-recreate
```

---

## In-container scripts

Available at `/usr/local/bin/` inside the running container:

| Script | Purpose |
|--------|---------|
| `peer-incentives-status.sh` | Human-readable or JSON status |
| `register-incentives.sh` | Claim grant + register node |
| `claim-peer-grant.sh` | Claim module feegrant only |
| `submit-sync-proof.sh` | Submit sync proof manually |
| `update-peer-endpoints.sh` | Update on-chain RPC/P2P |
| `check-peer-reachability.sh` | Test public port reachability |
| `deregister-incentives.sh` | Deregister node (advanced) |

Examples:

```bash
# Full status
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh

# JSON for automation
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh --json | jq .

# Manual register
docker exec hope-peer /usr/local/bin/register-incentives.sh

# Operator address
docker exec hope-peer hoped keys show operator -a \
  --home /home/hope/.hope --keyring-backend test
```

---

## Chain queries (host or container)

```bash
# Local sync status
curl -s http://127.0.0.1:26657/status | jq '.result.sync_info'

# Gateway height
curl -s https://test-gateway.hopenetwork.io/rpc/status | jq '.result.sync_info.latest_block_height'

# Your node on chain
OPERATOR=hope1...
curl -s "https://test-gateway.hopenetwork.io/api/hope/incentives/v1/node/${OPERATOR}" | jq .

# Peer grant status
curl -s "https://test-gateway.hopenetwork.io/api/hope/incentives/v1/peer_grant/${OPERATOR}" | jq .

# Eligible nodes
curl -s https://test-gateway.hopenetwork.io/api/hope/incentives/v1/eligible_nodes | jq .
```

---

## Volume & data

| Path (container) | Purpose |
|------------------|---------|
| `/home/hope/.hope` | Chain data + config + keyring |
| `/home/hope/.hope/config/.automation.env` | Effective AUTO_* flags |
| `/home/hope/.hope/config/.synced_once` | Sync marker (skip state sync on restart) |

Docker volume name: `hope-peer-data`

```bash
# Inspect volume
docker volume inspect hope-peer-data

# Backup (stop container first)
docker run --rm -v hope-peer-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/hope-peer-backup.tar.gz -C /data .
```

---

## Published image

```
public.ecr.aws/r8k0t0l9/hope-peer:testnet
public.ecr.aws/r8k0t0l9/hope-peer:latest
```

Pull:

```bash
docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

ECR Public does not require login for pulls in most regions.
