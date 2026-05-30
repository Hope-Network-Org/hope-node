# Peer node (sync only)

Run a Hope full node **without** incentives — useful for RPC access, development, or supporting network sync.

## Start

```bash
cp .env.example .env
# Leave HOPE_OPERATOR_MNEMONIC empty
./peer.sh up
```

Or with plain Docker:

```bash
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

## What you get

- Full chain state (query locally at `http://127.0.0.1:26657`)
- P2P participation (helps propagate blocks)
- No operator key, no on-chain registration, no heartbeats

## Check sync

```bash
curl -s http://127.0.0.1:26657/status | jq '.result.sync_info'
```

Or:

```bash
./peer.sh status
./peer.sh verify
```

## RPC usage

Local queries:

```bash
docker exec hope-peer hoped status --home /home/hope/.hope
docker exec hope-peer curl -sf http://127.0.0.1:26657/abci_info
```

Public gateway (same chain, no local node needed):

```bash
curl -s https://test-gateway.hopenetwork.io/rpc/status | jq .
```

## Upgrade to incentives later

1. Stop: `./peer.sh down`
2. Add `HOPE_OPERATOR_MNEMONIC` to `.env`
3. Start: `./peer.sh up` — automation runs on existing synced data

## Maintenance

| Task | Command |
|------|---------|
| Pull new image | `./peer.sh upgrade` |
| Restart | `./peer.sh restart` |
| Full re-sync | `./peer.sh resync` |
| Wipe everything | `./peer.sh fresh` |

See [troubleshooting.md](troubleshooting.md) for AppHash errors.
