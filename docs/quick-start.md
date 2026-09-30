# Quick start

**Easiest (no Docker):** [Launch on NerdNode →](https://www.nerdnode.io/service/137)

**By platform (incentives + Docker):**

| Platform | Guide |
|----------|--------|
| **Windows** | [Quick start — Windows](quick-start-windows.md) |
| **Linux (VPS or desktop)** | [Quick start — Linux & macOS](quick-start-linux-macos.md) |
| **macOS** | [Quick start — Linux & macOS](quick-start-linux-macos.md) |

Image (all platforms): `public.ecr.aws/r8k0t0l9/hope-peer:testnet`

Always **`docker pull`** or **`./peer.sh pull`** before a **new** node so you get the latest state-sync and incentives automation.

---

## Recommended: clone + incentives (~10–20 min)

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
cp .env.example .env
chmod +x peer.sh
# Edit .env: HOPE_OPERATOR_MNEMONIC, NODE_LABEL, STATE_SYNC_RPC=3.21.91.67:26657
./peer.sh pull
./peer.sh up
./peer.sh status
```

What happens automatically:

1. State sync from network snapshots (trust height from [chain.json](https://test-gateway.hopenetwork.io/chain.json))
2. Public IP detection (most VPS / cloud)
3. Peer grant claim → on-chain registration → sync proofs every ~2 h

See [incentives.md](incentives.md) for eligibility (sync + public P2P/RPC).

---

## Peer only (~5 min, no wallet)

Leave `HOPE_OPERATOR_MNEMONIC` empty in `.env`, then `./peer.sh up`.

Or one-shot Docker:

```bash
docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e STATE_SYNC_RPC=3.21.91.67:26657 \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

---

## Single `docker run` (no clone) {#single-docker-run-no-clone}

**Peer + incentives** — replace the mnemonic and label:

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

Use **`FORCE_STATE_SYNC=true`** only when intentionally wiping chain data and re-syncing (same as `./peer.sh resync`), not on a normal first install.

Check status:

```bash
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh
docker logs -f hope-peer
```

---

## Verify sync

Compare to [gateway status](https://test-gateway.hopenetwork.io/rpc/status): `catching_up` should be `false`.

Explorer: [Network analytics](https://explorer.hopenetwork.io/analytics/network)

---

## Next steps

- [How it works](how-it-works.md)
- [Configuration](configuration.md)
- [Port forwarding](port-forwarding.md) · [Cloud VPS](cloud-vps.md)
- [Troubleshooting](troubleshooting.md)
