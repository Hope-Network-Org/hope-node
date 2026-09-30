# Quick start

**Easiest (no Docker):** [Launch on NerdNode →](https://www.nerdnode.io/service/137)

**No git clone required.** Install [Docker](https://docs.docker.com/get-docker/), `docker pull`, then `docker run`. Same on Windows, Linux, and macOS.

| Platform tips | Guide |
|---------------|--------|
| **Windows** | [Quick start — Windows](quick-start-windows.md) |
| **Linux / macOS** | [Quick start — Linux & macOS](quick-start-linux-macos.md) |

Image: `public.ecr.aws/r8k0t0l9/hope-peer:testnet` (`linux/amd64` + `linux/arm64`)

---

## Peer + incentives (~10–20 min)

```bash
docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet

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

Watch sync and incentives:

```bash
docker logs -f hope-peer
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh
```

The container will state-sync (trust from [chain.json](https://test-gateway.hopenetwork.io/chain.json)), auto-detect public IP on most VPS hosts, claim peer grant, register on-chain, and submit sync proofs every ~2 h. See [incentives.md](incentives.md) for eligibility (sync + public **26656** / **26657**).

Use **`FORCE_STATE_SYNC=true`** only when re-syncing from scratch (wiping block data), not on a normal first install.

---

## Peer only (~5 min, no wallet)

```bash
docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet

docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e STATE_SYNC_RPC=3.21.91.67:26657 \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

---

## Useful Docker commands

| Task | Command |
|------|---------|
| Logs | `docker logs -f hope-peer` |
| Status | `docker exec hope-peer /usr/local/bin/peer-incentives-status.sh` |
| Restart (keep data) | `docker restart hope-peer` |
| Upgrade image | `docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet` then remove container and run the same `docker run` again (volume keeps chain data) |
| Stuck at height 0 | [troubleshooting.md](troubleshooting.md) — set `STATE_SYNC_RPC`, remove container, re-run with fresh sync or use clone repo’s `./peer.sh resync` |

---

## Verify sync

Compare to [gateway status](https://test-gateway.hopenetwork.io/rpc/status): `catching_up` should be `false`.

Explorer: [Network analytics](https://explorer.hopenetwork.io/analytics/network)

---

## Optional: clone repo + `./peer.sh`

Only if you want compose, `./peer.sh status`, `./peer.sh resync`, and port-forward helpers — **not required** to run a node.

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
cp .env.example .env
chmod +x peer.sh
# Edit .env, then:
./peer.sh pull
./peer.sh up
```

---

## Next steps

- [How it works](how-it-works.md)
- [Configuration](configuration.md)
- [Port forwarding](port-forwarding.md) · [Cloud VPS](cloud-vps.md)
- [Troubleshooting](troubleshooting.md)
