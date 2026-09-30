# Desktop applications

Native Hope peer apps for home operators are **coming soon**.

| Platform | Status | Notes |
|----------|--------|-------|
| **macOS** | Coming soon | Menu bar app, secure keychain mnemonic, eligibility dashboard |
| **Windows** | Coming soon | System tray app, same features as macOS |

---

## Until apps launch

Use **Docker** — no clone required. See [Quick start](quick-start.md):

```bash
docker pull public.ecr.aws/r8k0t0l9/hope-peer:testnet
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e STATE_SYNC_RPC=3.21.91.67:26657 \
  -e HOPE_OPERATOR_MNEMONIC="..." \
  -e NODE_LABEL=my-peer \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

---

## What the apps will provide

- One-click install (no terminal required)
- Secure storage for operator mnemonic (OS keychain)
- Live sync and eligibility status
- Port-forward guidance for home networks
- Link to [explorer analytics](https://explorer.hopenetwork.io/analytics/network)

The apps run the same `hope-peer` Docker image documented in this repo.

---

## Links

- [Hope Network](https://hopenetwork.io/)
- [Explorer](https://explorer.hopenetwork.io/)
- [Docker quick start](quick-start.md)

---

*Subscribe for updates on [hopenetwork.io](https://hopenetwork.io/).*
