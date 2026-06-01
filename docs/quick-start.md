# Quick start

## Peer only (5 minutes)

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
chmod +x peer.sh scripts/*.sh
cp .env.example .env
./peer.sh up
```

Watch sync:

```bash
./peer.sh logs
```

Check status:

```bash
./peer.sh status
```

When `catching_up: false` and height matches the [gateway](https://test-gateway.hopenetwork.io/rpc/status), you are synced.

---

## Peer with incentives (10–20 minutes)

### 1. Prepare mnemonic

Create or import a **24-word BIP-39** phrase. Example format (do not use this phrase):

```
abandon abandon abandon ... about
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:

```bash
HOPE_OPERATOR_MNEMONIC="your twenty four words here"
NODE_LABEL=my-home-peer
# Optional: send rewards elsewhere
# PAYOUT_RECIPIENT=hope1...
```

### 3. Start

```bash
./peer.sh up
./peer.sh logs
```

The container will:

1. State-sync to chain head (~5–15 min first boot)
2. Auto-detect your public IP (VPS/cloud)
3. Claim peer grant (gas sponsored)
4. Register on-chain
5. Submit sync proofs every **2 hours** (no heartbeat txs on testnet)

### 4. Verify

```bash
./peer.sh status
```

Look for:

- `AUTO_REGISTER_INCENTIVES=true (effective)`
- `AUTO_SYNC_PROOF=true`
- `Registered on chain`
- `Operator: hope1...`
- `Sync-proof hours: N / 11` (ramps over ~24h)

View on explorer: [Network analytics](https://explorer.hopenetwork.io/analytics/network)

### 5. Open ports (for eligibility)

If running at home:

```bash
./peer.sh ports
```

Forward TCP **26656** and **26657** on your router, then:

```bash
./peer.sh restart
./peer.sh verify
```

---

## Docker run (no git clone)

**Peer only:**

```bash
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

**With incentives (zero-config):**

```bash
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e FORCE_STATE_SYNC=true \
  -e STATE_SYNC=true \
  -e STATE_SYNC_RPC=3.21.91.67:26657 \
  -e HOPE_OPERATOR_MNEMONIC="your twenty four words" \
  -e NODE_LABEL=my-peer \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

Mnemonic alone enables claim → register → sync-proof automation. No heartbeat configuration needed.

Status inside container:

```bash
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh
```

---

## Next steps

- [How it works](how-it-works.md)
- [Incentives eligibility](incentives.md)
- [Troubleshooting](troubleshooting.md)
