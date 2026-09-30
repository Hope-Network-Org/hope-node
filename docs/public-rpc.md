# Public RPC peer (optional)

Hope peers already expose Tendermint RPC on **26657** for incentives reachability checks. You can also serve queries/broadcasts for wallets and load tools — **without becoming a validator**.

This does **not** change the network topology (2 validators + 1 seed + peer image).

## Requirements

1. Node synced (`catching_up: false`)
2. Security group / firewall / router: **TCP 26656** (P2P) and **26657** (RPC)
3. Registered `rpc_url` matches your public IP (automation updates this when `AUTO_UPDATE_ENDPOINTS=true`)

## Verify

```bash
curl -s http://127.0.0.1:26657/status | jq '.result.sync_info'
curl -s http://YOUR_PUBLIC_IP:26657/status | jq '.result.sync_info'
```

Public listing (refreshed on the gateway):

```bash
curl -s https://test-gateway.hopenetwork.io/rpc-pool.json | jq .
```

Healthy peers appear alongside the gateway and seed. Clients prefer the HTTPS gateway; peer RPCs are failover / capacity.

## Optional LCD (REST)

The image listens on **1317** inside the container. Publish it only if you want public REST:

```yaml
# docker-compose.yml ports:
- "26656:26656"
- "26657:26657"
- "1317:1317"   # optional public LCD
```

Most apps use `https://test-gateway.hopenetwork.io/api` for LCD (TLS + CORS). Local/scripts can use peer RPC.

## Incentives (unchanged)

Keep:

- `AUTO_SYNC_PROOF=true`
- `AUTO_REGISTER_INCENTIVES=true` (with mnemonic)
- Local tx broadcast via `http://127.0.0.1:26657` once synced (entrypoint already prefers this)

Public RPC load does not replace sync proofs. If RPC is overloaded, raise peer machine size or rate-limit at your firewall — do not turn off P2P.

## What not to do

- Do not set yourself as a validator unless you intend to
- Do not point `STATE_SYNC_RPC` at random lagging peers for bootstrap (prefer gateway host:port `3.21.91.67:26657`)
- Do not close **26656** — that breaks peer connectivity and incentives
