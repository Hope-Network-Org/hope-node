<p align="center">
  <a href="https://hopenetwork.io/">
    <img src="assets/repository-logo.png" alt="Hope Network" width="480">
  </a>
</p>

# Hope Node

Run a node on the **Hope Network testnet** — help the network stay in sync, and optionally **earn rewards** for keeping your node online.

**New here?** You do not need to be a developer. If you can install [Docker](https://docs.docker.com/get-docker/) and follow a short setup guide, you can run a node.

---

## Links

| | |
|---|---|
| **Hope Network** | [hopenetwork.io](https://hopenetwork.io/) |
| **Explorer** | [explorer.hopenetwork.io](https://explorer.hopenetwork.io/) |
| **See all registered nodes** | [Network analytics](https://explorer.hopenetwork.io/analytics/network) |
| **Testnet RPC** | [test-gateway.hopenetwork.io/rpc](https://test-gateway.hopenetwork.io/rpc) |
| **Testnet API** | [test-gateway.hopenetwork.io/api](https://test-gateway.hopenetwork.io/api) |

---

## Desktop apps *(coming soon)*

Easy install apps for **macOS** and **Windows** are on the way — no terminal required.

Until then, use the Docker setup in this repo. [Learn more →](docs/applications.md)

---

## Two ways to run a node

### 1. Peer node (support the network)

Your computer downloads and stays up to date with the chain. No wallet or passphrase needed.

### 2. Peer node + incentives (earn rewards)

Same as above, plus you register on-chain and can qualify for **daily token rewards** if your node stays synced, submits **sync proofs every ~2 hours**, and remains reachable on the public internet.

You will need a **24-word recovery phrase** (a standard crypto wallet phrase). The setup handles registration and sync proofs for you once the node is synced — no heartbeat transactions on current testnet.

**Running from home?** You may need to open two ports on your router so the network can reach your node. [Port forwarding guide →](docs/port-forwarding.md)

**Running on a cloud server (VPS)?** That is often the easiest path for rewards. [Cloud setup guide →](docs/cloud-vps.md)

---

## Get started

1. Install [Docker](https://docs.docker.com/get-docker/)
2. Download this repo and open a terminal in the folder:

   ```bash
   git clone https://github.com/Hope-Network-Org/hope-node.git
   cd hope-node
   cp .env.example .env
   chmod +x peer.sh
   ```

3. **Peer only** — start the node:

   ```bash
   ./peer.sh up
   ```

   **With incentives** — add your 24-word phrase to `.env`, then start:

   ```bash
   # Edit .env and set HOPE_OPERATOR_MNEMONIC="word1 word2 ... word24"
   ./peer.sh up
   ```

4. Check progress:

   ```bash
   ./peer.sh status
   ```

Step-by-step walkthrough: [docs/quick-start.md](docs/quick-start.md)

---

## Documentation

Technical details, troubleshooting, and advanced options live in the [docs](docs/) folder:

- [Quick start](docs/quick-start.md) — full first-time setup
- [Incentives](docs/incentives.md) — how rewards work
- [Requirements](docs/requirements.md) — computer and network needs
- [Port forwarding](docs/port-forwarding.md) — home Wi‑Fi setup
- [Cloud / VPS](docs/cloud-vps.md) — run on a server
- [Troubleshooting](docs/troubleshooting.md) — when something goes wrong
- [All docs →](docs/README.md)

---

## Keep your phrase safe

If you use incentives, your `.env` file contains your 24-word phrase. **Never share it** or commit it to git. Treat it like a wallet password.

More detail: [docs/incentives.md](docs/incentives.md)

---

[Hope Network](https://hopenetwork.io/) · [Explorer](https://explorer.hopenetwork.io/)
