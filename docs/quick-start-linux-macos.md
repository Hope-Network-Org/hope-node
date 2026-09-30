# Quick start — Linux & macOS

Run a Hope testnet peer with **incentives**. **No git clone** — `docker pull` and `docker run` only.

Image: `public.ecr.aws/r8k0t0l9/hope-peer:testnet` — **multi-arch** (`linux/amd64` + `linux/arm64`)

**Windows:** [quick-start-windows.md](quick-start-windows.md) · **Overview:** [quick-start.md](quick-start.md)

---

## 1. Install Docker

- **Linux VPS:** `curl -fsSL https://get.docker.com | sh` — add your user to the `docker` group, then log out/in.
- **Mac:** [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/) — on Apple Silicon, do **not** force `linux/amd64`; use native **arm64**.

Open firewall / security group: **26656** and **26657** inbound for incentives. [cloud-vps.md](cloud-vps.md) · [port-forwarding.md](port-forwarding.md)

---

## 2. Pull and run (incentives)

```bash
docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet

docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e CHAIN_METADATA_URL=https://test-gateway.hopenetwork.io/chain.json \
  -e STATE_SYNC=true \
  -e STATE_SYNC_RPC=3.21.91.67:26657 \
  -e HOPE_OPERATOR_MNEMONIC="your twenty four word bip39 phrase here" \
  -e NODE_LABEL=my-peer \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

Optional: `-e PAYOUT_RECIPIENT=hope1...`

```bash
docker logs -f hope-peer
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh
```

State sync uses `STATE_SYNC_RPC` and trust metadata from [chain.json](https://test-gateway.hopenetwork.io/chain.json). First boot: **5–20 minutes**.

**Peer only:** drop mnemonic and `NODE_LABEL` from the command above.

---

## Docker maintenance

| Task | Command |
|------|---------|
| Restart | `docker restart hope-peer` |
| Upgrade | `docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet`, remove container, re-run the same `docker run` (volume keeps data) |
| Stuck at height 0 | [troubleshooting.md](troubleshooting.md) |

Existing synced nodes are unchanged until you pull a new image and recreate the container.

---

## Optional: clone repo + `./peer.sh`

Same image; adds `./peer.sh resync`, compose, and port helpers:

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
cp .env.example .env
chmod +x peer.sh
./peer.sh pull && ./peer.sh up
```

---

## Managed hosting

[NerdNode — Hope peer →](https://www.nerdnode.io/service/137)
