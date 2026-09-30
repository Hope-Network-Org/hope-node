# Quick start — Windows (Docker Desktop)

Run a Hope testnet peer with **incentives** on Windows 10/11 using [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) (WSL2 backend recommended).

Same Docker image as Linux and macOS: `public.ecr.aws/r8k0t0l9/hope-peer:testnet` (`linux/amd64`).

**Other platforms:** [Linux & macOS](quick-start-linux-macos.md) · [Overview](quick-start.md)

---

## 1. Install Docker Desktop

1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Enable the **WSL2** backend when prompted.
3. Restart if Docker asks you to.
4. Confirm in PowerShell or **Git Bash**:

```powershell
docker version
docker compose version
```

---

## 2. Clone the public node repo (recommended)

This gives you `peer.sh`, compose, and `.env` — the same flow Hope documents for all self-hosted peers.

In **Git Bash** or PowerShell:

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
cp .env.example .env
chmod +x peer.sh
```

Edit `.env` in Notepad or your editor:

```bash
HOPE_OPERATOR_MNEMONIC="your twenty four word bip39 phrase here"
NODE_LABEL=my-windows-peer
STATE_SYNC_RPC=3.21.91.67:26657
```

Leave `DOCKER_PLATFORM` **unset** (use the native `linux/amd64` image on Windows).

---

## 3. Pull the latest image and start

```bash
./peer.sh pull
./peer.sh up
./peer.sh logs
```

First state sync usually takes **5–20 minutes**. The entrypoint reads trust height from [chain.json](https://test-gateway.hopenetwork.io/chain.json) (`state_sync.trust_*`) so verification stays **below** the snapshot height (same fix on Windows, Linux, and Mac).

When sync finishes:

```bash
./peer.sh status
```

You should see `catching_up: false`, registration, and sync-proof automation if the mnemonic is set.

---

## 4. Ports (required for incentives at home)

Forward **TCP 26656** and **26657** on your router to this PC’s LAN IP. See [port-forwarding.md](port-forwarding.md).

Allow Docker through **Windows Defender Firewall** for those ports if prompted.

Then:

```bash
./peer.sh restart
docker exec hope-peer /usr/local/bin/check-peer-reachability.sh
```

---

## 5. Verify on explorer

[Network analytics](https://explorer.hopenetwork.io/analytics/network) — search for your `NODE_LABEL` or operator address from `./peer.sh status`.

---

## Useful commands

| Task | Command |
|------|---------|
| Status | `./peer.sh status` |
| Logs | `./peer.sh logs` |
| Restart (keep data) | `./peer.sh restart` |
| Upgrade image | `./peer.sh upgrade` |
| Stuck at height 0 | See [troubleshooting.md](troubleshooting.md) → `./peer.sh resync` |

---

## Plain `docker run` (no git clone)

If you prefer a single command, see [quick-start.md](quick-start.md#single-docker-run-no-clone). Use Git Bash or PowerShell; put the mnemonic in `.env` on the host and pass `-e` flags — **never** commit the phrase.

---

## Zero setup alternative

[Launch on NerdNode →](https://www.nerdnode.io/service/137) — no Docker or port forwarding.
