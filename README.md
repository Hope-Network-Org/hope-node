<p align="center">
  <a href="https://hopenetwork.io/">
    <img src="assets/repository-logo.png" alt="Hope Network" width="480">
  </a>
</p>

# Hope Node

Run a node on the **Hope Network testnet** — stay in sync with the network, and optionally **earn rewards**.

---

## Easiest way: NerdNode (no setup)

Prefer zero technical work? Deploy a Hope peer on managed hardware in a few clicks — no Docker, ports, or VPS required.

<p align="center">
  <a href="https://www.nerdnode.io/service/137">
    <img src="assets/nerdnode-logo.png" alt="NerdNode" width="320">
  </a>
</p>

<p align="center">
  <a href="https://www.nerdnode.io/service/137"><strong>Launch a Hope node on NerdNode →</strong></a><br>
  <sub>Hosted · auto-updated · from $5/month · no install or port forwarding</sub>
</p>

---

## Links

| | |
|---|---|
| **Hope Network** | [hopenetwork.io](https://hopenetwork.io/) |
| **Explorer** | [explorer.hopenetwork.io](https://explorer.hopenetwork.io/) |
| **See all registered nodes** | [Network analytics](https://explorer.hopenetwork.io/analytics/network) |
| **Managed hosting** | [NerdNode — Hope](https://www.nerdnode.io/service/137) |
| **Testnet RPC** | [test-gateway.hopenetwork.io/rpc](https://test-gateway.hopenetwork.io/rpc) |

---

## Run it yourself (Docker)

You do **not** need to clone this repo. Install [Docker](https://docs.docker.com/get-docker/), then run the public image (`linux/amd64` and `linux/arm64`).

**Step-by-step with incentives:**

| Platform | Guide |
|----------|--------|
| Windows | [docs/quick-start-windows.md](docs/quick-start-windows.md) |
| Linux / macOS | [docs/quick-start-linux-macos.md](docs/quick-start-linux-macos.md) |
| All platforms (overview) | [docs/quick-start.md](docs/quick-start.md) |

**Recommended:** clone this repo, set `.env`, use `./peer.sh pull` then `./peer.sh up` (same flow on Windows, Linux, and Mac).

### 1. Install Docker

- [Docker Desktop](https://docs.docker.com/get-docker/) (Mac / Windows / Linux), **or**
- On a Linux VPS: `curl -fsSL https://get.docker.com | sh`

### 2. Run the node

Pull the latest image before a **new** peer:

```bash
docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

**Peer only** (no wallet, just support the network):

```bash
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e STATE_SYNC_RPC=3.21.91.67:26657 \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

**Peer + incentives** (earn rewards — needs a 24-word recovery phrase):

```bash
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e CHAIN_METADATA_URL=https://test-gateway.hopenetwork.io/chain.json \
  -e STATE_SYNC=true \
  -e STATE_SYNC_RPC=3.21.91.67:26657 \
  -e HOPE_OPERATOR_MNEMONIC="your twenty four words here" \
  -e NODE_LABEL=my-hope-peer \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

First sync usually takes ~5–20 minutes. Trust height for state sync is read from [chain.json](https://test-gateway.hopenetwork.io/chain.json) (`state_sync`) on all platforms — not Windows-specific.

On Apple Silicon, let Docker pick the native **arm64** image (do **not** force `linux/amd64`).

### 3. Check status

```bash
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh
```

Or peer health only:

```bash
docker exec hope-peer curl -sf http://127.0.0.1:26657/status | head
```

Useful commands:

```bash
docker logs -f hope-peer          # follow logs
docker restart hope-peer          # restart (keeps data)
docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet && \
  docker rm -f hope-peer          # then re-run the docker run command above to upgrade
```

---

## Two modes

| Mode | What you need | What you get |
|------|---------------|--------------|
| **Peer only** | Docker | Help the network stay synced |
| **Peer + incentives** | Docker + 24-word phrase + public ports | Daily rewards when eligible |

For incentives on current testnet: stay synced, submit **sync proofs ~every 2 hours** (automatic when mnemonic is set), and stay reachable on the public internet.

- **No setup?** [NerdNode managed hosting →](https://www.nerdnode.io/service/137)
- **Home Wi‑Fi?** Forward TCP **26656** and **26657**. [Port guide →](docs/port-forwarding.md)
- **Cloud VPS?** Usually easiest for self-hosted rewards. [Cloud guide →](docs/cloud-vps.md)

---

## Optional: clone this repo

Only if you want helper scripts (`./peer.sh`), compose, or local docs checkout:

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
cp .env.example .env
chmod +x peer.sh
./peer.sh up
```

Same Docker image either way: `public.ecr.aws/r8k0t0l9/hope-peer:testnet`

---

## Desktop apps *(coming soon)*

macOS / Windows installers are on the way. Until then, use NerdNode or Docker above. [Learn more →](docs/applications.md)

---

## Documentation

- [Quick start (overview)](docs/quick-start.md)
- [Quick start — Windows](docs/quick-start-windows.md)
- [Quick start — Linux & macOS](docs/quick-start-linux-macos.md)
- [Incentives](docs/incentives.md)
- [Requirements](docs/requirements.md)
- [Port forwarding](docs/port-forwarding.md)
- [Cloud / VPS](docs/cloud-vps.md)
- [Troubleshooting](docs/troubleshooting.md)
- [All docs →](docs/README.md)

---

## Keep your phrase safe

If you set `HOPE_OPERATOR_MNEMONIC`, treat it like a wallet password. **Never share it** or put it in a public place.

---

[Hope Network](https://hopenetwork.io/) · [Explorer](https://explorer.hopenetwork.io/) · [NerdNode](https://www.nerdnode.io/service/137)
