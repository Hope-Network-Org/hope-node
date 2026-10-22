# AI agent prompt — Hope managed peer integration

Copy the fenced block into Cursor, Claude Code, Copilot, or similar.

Placeholders stay in the prompt until you know your values (or let the agent ask you):

| Placeholder | Meaning |
|-------------|---------|
| `{{PROVIDER_NAME}}` | Hosting brand or product name |
| `{{PANEL_ORIGIN}}` | Customer dashboard **HTTPS origin** (scheme + host, no path) — same site as `/api/hope-wallet` |

Also on [node.hopenetwork.io/#managed-hosting](https://node.hopenetwork.io/#managed-hosting) (one-click copy).

---

```text
You are integrating Hope Network testnet **incentives peer hosting** for {{PROVIDER_NAME}}.

Resolve placeholders when you start building:
- {{PROVIDER_NAME}} — hosting brand or product name
- {{PANEL_ORIGIN}} — customer dashboard HTTPS origin (scheme + host, no path); Hope Wallet session API on this origin

## Goal

Deliver a production-ready managed Hope peer product on {{PANEL_ORIGIN}} that:

1. Provisions and maintains the official `hope-peer:testnet` Docker container per customer.
2. Enables **incentives** (on-chain registration, sync proofs, daily reward eligibility).
3. Lets customers connect **Hope Wallet** and set a **payout address** without ever handing you their 24-word seed phrase.
4. Keeps the **operator** hot key on the host; customer wallet is **payout-only**.

## Canonical documentation (read and follow)

Repository: https://github.com/Hope-Network-Org/hope-node

- docs/quick-start.md — docker pull/run, ports, mnemonic
- docs/incentives.md — automation, eligibility, sync proofs
- docs/configuration.md — env vars
- docs/public-rpc.md — optional public RPC behavior
- wallet/docs/hosted-nodes.md — Hope Wallet connect, session API, MsgAuthorizeOperator, MsgUpdateNode, sweep
- docs/nerdnode-payout.md — end-to-end reference for a live host
- wallet/docs/hosted/PayoutWallet.tsx, sessions.ts, applyPayout.ts — copy-paste samples

Chain ID: hope-testnet-2
LCD: https://test-gateway.hopenetwork.io/api
CometBFT RPC: https://test-gateway.hopenetwork.io/rpc
Docker image: public.ecr.aws/r8k0t0l9/hope-peer:testnet

## Security rules (non-negotiable)

- NEVER collect, store, or log the customer’s BIP-39 mnemonic.
- Generate a **separate** HOPE_OPERATOR_MNEMONIC per node on the server; customer uses Hope Wallet only for payout.
- NEVER import `@hopenetwork/wallet/node` or operator mnemonics in frontend bundles.
- Hope Wallet connect/session confirm MUST be on the same HTTPS origin as the panel ({{PANEL_ORIGIN}}).
- Operator key stays on the node/VPS; payout key stays in Hope Wallet.

## Part A — Infrastructure / provisioning

For each new subscription:

1. Allocate a VPS or tenant with public IPv4, open **TCP 26656** (P2P) and **26657** (RPC) to the internet.
2. Pull and run the peer:

   docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet

   docker run -d --name hope-peer --restart unless-stopped \
     -p 26656:26656 -p 26657:26657 \
     -v hope-peer-data:/home/hope/.hope \
     -e CHAIN_METADATA_URL=https://test-gateway.hopenetwork.io/chain.json \
     -e STATE_SYNC=true \
     -e STATE_SYNC_RPC=3.21.91.67:26657 \
     -e HOPE_OPERATOR_MNEMONIC="<host-generated-24-words>" \
     -e NODE_LABEL="<customer-visible-label>" \
     -e PAYOUT_RECIPIENT="<hope1 payout or operator if not yet set>" \
     public.ecr.aws/r8k0t0l9/hope-peer:testnet

3. Persist volume `hope-peer-data`; document upgrade path (`docker pull` + recreate container).
4. On VPS, rely on AUTO_DETECT_EXTERNAL_ADDRESS; at home/NAT, set EXTERNAL_ADDRESS and RPC_URL explicitly (see configuration.md).
5. Expose health to your panel: `docker exec hope-peer /usr/local/bin/peer-incentives-status.sh` and CometBFT `/status`.

Container automation (when mnemonic is set): claim peer grant, register node, sync proofs every ~2h, update endpoints. Do not disable AUTO_REGISTER_INCENTIVES / AUTO_SYNC_PROOF on testnet.

## Part B — Customer payout wallet (Hope Wallet Connect)

npm install @hopenetwork/wallet

Implement on {{PANEL_ORIGIN}}:

### B1. Session API (backend on same origin)

Routes (TTL ~5 minutes, store in Redis/DB):

- POST /api/hope-wallet/sessions — create pending session from SDK payload
- GET /api/hope-wallet/sessions/:id — poll status
- DELETE /api/hope-wallet/sessions/:id — cancel
- POST /api/hope-wallet/sessions/:id/confirm — Hope Wallet posts proof (no cookies); set status connected + address

Use wallet/docs/hosted/sessions.ts as the reference.

### B2. Connect UI (frontend)

Use @hopenetwork/wallet and @hopenetwork/wallet/react:

- createHttpTransport({ baseUrl: `${origin}/api/hope-wallet` })
- VerifyWalletPanel or connect() with chainId hope-testnet-2, relayUrl: true
- On verified, capture PAYOUT hope1 address

### B3. Authorize operator (customer signs in wallet)

When PAYOUT !== OPERATOR (operator = address derived from HOPE_OPERATOR_MNEMONIC on that node):

- MessagePanel with MsgAuthorizeOperator:
  - payoutRecipient: PAYOUT
  - operator: OPERATOR
  - label: "hosted" or {{PROVIDER_NAME}}

Treat ErrAuthorizationExists as success. If PAYOUT === OPERATOR, skip authorize (ErrSelfAuthorization).

### B4. Bind payout on-chain (host signs on server)

After authorization, from a **server-side** process with access to HOPE_OPERATOR_MNEMONIC (never the browser):

- Broadcast MsgUpdateNode with payoutRecipient: PAYOUT
- Set PAYOUT_RECIPIENT env on the container to match
- Optional: MsgSend sweep leftover uhope from OPERATOR to PAYOUT (operator pays bank send fee; leave gas reserve)

Use signAndBroadcast from @hopenetwork/wallet/node OR docker exec hoped tx incentives update-node ... --sign-mode pq-direct

Changing .env alone does NOT update an already-registered node.

### B5. Panel flows

- **New node:** generate operator mnemonic → connect wallet → authorize if needed → start container with PAYOUT_RECIPIENT → show OPERATOR + sync status + explorer link
- **Existing node, new payout:** connect → authorize → update-node → sweep → persist env

Build a single “Payout wallet” page per node listing OPERATOR, current on-chain payout, and actions.

## Part C — Product / ops

- Surface link to https://explorer.hopenetwork.io/analytics/network for registration visibility.
- Document for customers: rewards require public 26656/26657 and healthy sync proofs (see incentives.md).
- Rate-limit session endpoints; audit confirm handler.
- Add monitoring alerts if sync proof misses or height lags gateway.

## Deliverables checklist

- [ ] IaC or internal API to create/destroy hope-peer containers with secrets management for operator mnemonics
- [ ] Customer panel page on {{PANEL_ORIGIN}} with Hope Wallet connect + authorize + status
- [ ] Session API deployed on same origin
- [ ] Server job to apply MsgUpdateNode after authorize
- [ ] Runbook for image upgrades and resync (FORCE_STATE_SYNC when appropriate)
- [ ] Support doc for {{PROVIDER_NAME}} customers (no seed phrase collection)

Implement incrementally: provisioning first, then wallet payout UX, then sweep/edge cases. Match patterns in wallet/docs/hosted/* and docs/nerdnode-payout.md. Ask clarifying questions only for {{PROVIDER_NAME}}-specific auth/billing IDs—not for Hope chain behavior covered above.
```
