# Requirements

## Software

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| **Docker** | 20.10+ | [Install Docker](https://docs.docker.com/get-docker/) |
| **Docker Compose** | v2 (plugin) | Included with Docker Desktop |
| **curl** & **jq** | any recent | For `./peer.sh status` on the host (optional) |

### Apple Silicon (M1/M2/M3 Mac)

The published testnet image is **linux/amd64**. Docker Desktop runs it via emulation automatically. For compose, add to `.env`:

```bash
DOCKER_PLATFORM=linux/amd64
```

Or pull explicitly:

```bash
docker pull --platform linux/amd64 public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

---

## Hardware

| Resource | Minimum | Recommended |
|----------|---------|---------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB free | 80 GB SSD |
| Network | Stable broadband | VPS with public IP for incentives |

Chain data grows over time; use a persistent Docker volume (`hope-peer-data`).

---

## Network

### All peers

- **Outbound** HTTPS (genesis, chain metadata, API)
- **Outbound** P2P to other Hope peers (TCP 26656)
- **Inbound** optional for local RPC queries on 26657

### Incentives eligibility

Attestors must reach your node on the **public internet**:

| Port | Protocol | Purpose |
|------|----------|---------|
| **26656** | TCP | CometBFT P2P |
| **26657** | TCP | Tendermint RPC |

On a **VPS**, open these in the cloud security group. At **home**, forward them on your router — see [port-forwarding.md](port-forwarding.md).

Sync and registration work without public ports; **daily payout eligibility** requires reachable P2P/RPC.

---

## Operator mnemonic (incentives only)

To run with incentives you need a **BIP-39 24-word mnemonic** using the **standard English wordlist**.

- Generate with any BIP-39 tool or `hoped keys add ...` on a secure machine
- Store offline; treat as a **hot operator key** (signs sync proofs and registration msgs)
- Invalid words → container exits with `invalid mnemonic`

You do **not** need uhope in the wallet before registration. The chain sponsors the first transactions via `claim-peer-grant`.

---

## Chain

| Setting | Value |
|---------|-------|
| Chain ID | `hope-testnet-2` |
| Denom | `uhope` |
| Gateway RPC | `https://test-gateway.hopenetwork.io/rpc` |
| State-sync RPC | `3.21.91.67:26657` (host:port; default in compose) |
| Chain metadata | `https://test-gateway.hopenetwork.io/chain.json` |
| Docker image | `public.ecr.aws/r8k0t0l9/hope-peer:testnet` |
| Eligibility | ≥ 11 sync-proof hours / 12 slots (24h window); proofs every ~2h |

No manual genesis download or peer list configuration is required — the container loads everything from chain metadata on first start.
