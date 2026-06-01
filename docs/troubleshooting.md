# Troubleshooting

## Container exits immediately

**Invalid mnemonic**

```
ERROR: HOPE_OPERATOR_MNEMONIC is not a valid BIP-39 phrase
```

Use exactly **24 words** from the [BIP-39 English wordlist](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt). Custom phrases will not work.

**Port already in use**

```bash
sudo lsof -i :26656 -i :26657
# Stop conflicting process or change host ports in docker-compose.yml
```

---

## Stuck catching up / slow sync

**First boot:** State sync takes 5–20 minutes. Watch:

```bash
./peer.sh logs
```

**Restart loop:** If you wiped data mid-sync, run:

```bash
./peer.sh resync
```

**Peer connection timeouts:** Normal if one seed is unreachable; the node connects via validator persistent peers from chain.json.

**Stuck at height 0:** State sync needs a reachable **host:port** RPC with snapshots — not the HTTPS gateway alone. Add to `.env`:

```bash
STATE_SYNC_RPC=3.21.91.67:26657
```

Then:

```bash
./peer.sh resync
```

P2P timeouts to seed/gateway during first boot are common; RPC state sync still works when `STATE_SYNC_RPC` is set correctly.

---

## AppHash mismatch

Log contains:

```
wrong Block.Header.AppHash
```

The local binary must match validators. Use the **published image** (not an old local build):

```bash
./peer.sh upgrade
# If persists:
./peer.sh resync
```

Do **not** use `./peer.sh reset` for AppHash errors — use **resync**.

---

## Not registered / incentives failed

Check logs for registration attempts:

```bash
docker logs hope-peer 2>&1 | grep -iE 'register|claim|grant|ERROR|WARN'
```

**Manual retry** (after synced):

```bash
./peer.sh register
```

**Status dashboard:**

```bash
./peer.sh status
```

Ensure `HOPE_OPERATOR_MNEMONIC` is set and you did **not** pass `AUTO_REGISTER_INCENTIVES=false`.

---

## AUTO_REGISTER shows false

Docker `inspect` may show image defaults. Check **effective** flags:

```bash
docker exec hope-peer cat /home/hope/.hope/config/.automation.env
./peer.sh status
```

If mnemonic is set, automation should show `true (effective)`.

---

## Public P2P/RPC blocked

Status shows:

```
Public P2P/RPC not reachable
NOT ELIGIBLE YET
```

Fix port forwarding or security group — see [port-forwarding.md](port-forwarding.md).

Sync and registration can still succeed; eligibility needs open ports.

---

## ECR pull 403

```bash
docker logout public.ecr.aws
docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

If using AWS CLI:

```bash
aws ecr-public get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin public.ecr.aws
```

---

## Apple Silicon issues

Add to `.env`:

```bash
DOCKER_PLATFORM=linux/amd64
```

Pull explicitly:

```bash
docker pull --platform linux/amd64 public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

---

## Wipe and start over

```bash
./peer.sh fresh
```

This deletes **all** chain data and the operator keyring in the volume. You will get a new on-chain registration if you use the same mnemonic (may hit "already registered" — that's OK).

---

## Get help

- [Hope Network](https://hopenetwork.io/)
- [Explorer](https://explorer.hopenetwork.io/)
- Check [Network analytics](https://explorer.hopenetwork.io/analytics/network) for your node record

Include output of:

```bash
./peer.sh status
docker logs hope-peer 2>&1 | tail -100
```
