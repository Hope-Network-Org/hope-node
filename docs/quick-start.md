# Quick start

**Easiest (no Docker):** [Launch on NerdNode →](https://www.nerdnode.io/service/137) — managed hosting, no install or port forwarding.

---

You only need [Docker](https://docs.docker.com/get-docker/). No git clone required.

Image: `public.ecr.aws/r8k0t0l9/hope-peer:testnet` (multi-arch: `linux/amd64` + `linux/arm64`)

---

## Peer only (~5 minutes)

```bash
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

Watch logs:

```bash
docker logs -f hope-peer
```

When height matches the [gateway](https://test-gateway.hopenetwork.io/rpc/status) and `catching_up` is false, you are synced.

---

## Peer with incentives (~10–20 minutes)

### 1. Prepare a 24-word BIP-39 mnemonic

Create or import one in a wallet you control. Do not use example phrases from docs.

### 2. Run with incentives env

```bash
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e FORCE_STATE_SYNC=true \
  -e STATE_SYNC=true \
  -e STATE_SYNC_RPC=3.21.91.67:26657 \
  -e HOPE_OPERATOR_MNEMONIC="your twenty four words here" \
  -e NODE_LABEL=my-hope-peer \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

Optional: send rewards to another address with `-e PAYOUT_RECIPIENT=hope1...`

The container will:

1. State-sync to chain head (~5–15 min first boot)
2. Auto-detect public IP (on most VPS / cloud hosts)
3. Claim peer grant (gas sponsored)
4. Register on-chain
5. Submit sync proofs every **~2 hours**

### 3. Verify

```bash
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh
```

Look for registered operator, sync-proof hours, and `catching_up: false`.

View on explorer: [Network analytics](https://explorer.hopenetwork.io/analytics/network)

### 4. Open ports (for eligibility)

If running at home, forward TCP **26656** and **26657**, then:

```bash
docker restart hope-peer
docker exec hope-peer /usr/local/bin/check-peer-reachability.sh
```

See [port-forwarding.md](port-forwarding.md).

---

## Optional: clone + `./peer.sh`

Use the repo if you want compose helpers:

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
cp .env.example .env
chmod +x peer.sh scripts/*.sh
# Edit .env for incentives if needed
./peer.sh up
./peer.sh status
```

---

## Next steps

- [How it works](how-it-works.md)
- [Incentives eligibility](incentives.md)
- [Cloud / VPS](cloud-vps.md)
- [Troubleshooting](troubleshooting.md)
