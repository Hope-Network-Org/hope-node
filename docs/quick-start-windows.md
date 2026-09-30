# Quick start — Windows (Docker Desktop)

Run a Hope testnet peer with **incentives** on Windows 10/11. **No git clone** — only Docker.

Image: `public.ecr.aws/r8k0t0l9/hope-peer:testnet` (`linux/amd64`)

**Linux / macOS:** [quick-start-linux-macos.md](quick-start-linux-macos.md) · **Overview:** [quick-start.md](quick-start.md)

---

## 1. Install Docker Desktop

1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Use the **WSL2** backend when prompted.
3. In **PowerShell** or **Git Bash**:

```powershell
docker version
```

---

## 2. Pull and run (incentives)

Replace the mnemonic and label. Run in PowerShell or Git Bash:

```bash
docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet

docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e CHAIN_METADATA_URL=https://test-gateway.hopenetwork.io/chain.json \
  -e STATE_SYNC=true \
  -e STATE_SYNC_RPC=3.21.91.67:26657 \
  -e HOPE_OPERATOR_MNEMONIC="your twenty four word bip39 phrase here" \
  -e NODE_LABEL=my-windows-peer \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

First state sync usually takes **5–20 minutes**. Trust height comes from [chain.json](https://test-gateway.hopenetwork.io/chain.json) automatically.

```bash
docker logs -f hope-peer
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh
```

Look for `catching_up: false`, registration, and sync-proof automation.

**Peer only (no incentives):** omit `HOPE_OPERATOR_MNEMONIC` and `NODE_LABEL` from the `docker run` command.

---

## 3. Ports (incentives at home)

Forward **TCP 26656** and **26657** on your router to this PC. [port-forwarding.md](port-forwarding.md)

Allow Docker through **Windows Defender Firewall** if prompted.

```bash
docker restart hope-peer
docker exec hope-peer /usr/local/bin/check-peer-reachability.sh
```

---

## 4. Explorer

[Network analytics](https://explorer.hopenetwork.io/analytics/network) — search your `NODE_LABEL` or operator address from the status script output.

---

## Useful commands

| Task | Command |
|------|---------|
| Logs | `docker logs -f hope-peer` |
| Status | `docker exec hope-peer /usr/local/bin/peer-incentives-status.sh` |
| Restart | `docker restart hope-peer` |
| Upgrade | `docker pull …` then remove container and run the same `docker run` again |
| Stuck sync | [troubleshooting.md](troubleshooting.md) |

---

## Optional: clone repo + `./peer.sh`

Helper scripts only — same Docker image:

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
cp .env.example .env
chmod +x peer.sh
./peer.sh pull && ./peer.sh up
```

---

## Zero setup

[NerdNode →](https://www.nerdnode.io/service/137) — no Docker or port forwarding.
