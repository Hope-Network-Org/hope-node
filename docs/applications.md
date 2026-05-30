# Desktop applications

Native Hope peer apps for home operators are **coming soon**.

| Platform | Status | Notes |
|----------|--------|-------|
| **macOS** | Coming soon | Menu bar app, secure keychain mnemonic, eligibility dashboard |
| **Windows** | Coming soon | System tray app, same features as macOS |

---

## Until apps launch

Use **Docker** with this repository — same container image the apps will wrap:

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
cp .env.example .env
# Set HOPE_OPERATOR_MNEMONIC for incentives
./peer.sh up
```

See [Quick start](quick-start.md) for full instructions.

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
