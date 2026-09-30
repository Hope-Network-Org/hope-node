# Quick start — Linux & macOS

Run a Hope testnet peer with **incentives** on a Linux VPS, Linux desktop, or Mac with Docker.

Image: `public.ecr.aws/r8k0t0l9/hope-peer:testnet` — **multi-arch** (`linux/amd64` + `linux/arm64`).

**Windows:** [Quick start — Windows](quick-start-windows.md) · **Overview:** [quick-start.md](quick-start.md)

---

## Recommended: clone + `./peer.sh`

Works the same on Ubuntu VPS, Debian, Fedora, and macOS (Docker Desktop or Colima).

### 1. Install Docker

- **Linux VPS:** `curl -fsSL https://get.docker.com | sh` then add your user to the `docker` group.
- **Mac:** [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/) — use **Apple Silicon native** (do **not** set `DOCKER_PLATFORM=linux/amd64`).

### 2. Clone and configure

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
cp .env.example .env
chmod +x peer.sh
```

Edit `.env`:

```bash
HOPE_OPERATOR_MNEMONIC="your twenty four word bip39 phrase here"
NODE_LABEL=my-peer
STATE_SYNC_RPC=3.21.91.67:26657
# Optional: PAYOUT_RECIPIENT=hope1...
```

On **Apple Silicon**, leave `DOCKER_PLATFORM` empty so Docker runs the **arm64** image natively.

### 3. Start

```bash
./peer.sh pull
./peer.sh up
./peer.sh logs
```

State sync uses:

- `STATE_SYNC_RPC` — host:port RPC with snapshots
- `chain.json` → `state_sync.trust_height` / `trust_hash` — trust point **below** snapshot (fast verification on every OS)

Expect **5–20 minutes** on first boot.

```bash
./peer.sh status
```

### 4. Cloud VPS

On AWS, Hetzner, DigitalOcean, etc., public IP auto-detection usually works. Open security group / firewall **26656** and **26657** inbound. Details: [cloud-vps.md](cloud-vps.md).

### 5. Home network

Forward ports **26656** and **26657**. [port-forwarding.md](port-forwarding.md).

---

## Peer only (no incentives)

Leave `HOPE_OPERATOR_MNEMONIC` empty in `.env`, then `./peer.sh up`. Or see [peer-node.md](peer-node.md).

---

## Maintenance

| Task | Command |
|------|---------|
| Upgrade to latest image | `./peer.sh upgrade` |
| Restart | `./peer.sh restart` |
| Full re-sync | `./peer.sh resync` |
| Clean slate | `./peer.sh fresh` |

Existing synced nodes are **not** affected by image updates until you run `upgrade` or `resync`.

---

## Troubleshooting

- Stuck at height 0 → [troubleshooting.md](troubleshooting.md)
- AppHash / trust timeout → pull latest image + `./peer.sh resync` (fixed in current `hope-peer:testnet`)

---

## Managed hosting

[NerdNode — Hope peer →](https://www.nerdnode.io/service/137)
