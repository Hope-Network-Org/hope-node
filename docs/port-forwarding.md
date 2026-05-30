# Port forwarding

Incentives **eligibility** requires attestors to reach your node on the public internet. Sync and registration work without it; payout verification does not.

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| **26656** | TCP | CometBFT P2P |
| **26657** | TCP | Tendermint RPC |

Docker Compose already maps these on your **host**. You must forward them from your **router** to your PC's LAN IP (home users).

---

## Quick helper

```bash
./peer.sh ports
```

Prints LAN IP, public IP, and a fill-in table for your router admin UI.

---

## Manual router steps

1. Find your PC's LAN IP (e.g. `192.168.1.42`)
2. Open router admin (often `192.168.1.1`)
3. Create **two** port-forward rules:

| Name | External port | Internal IP | Internal port | Protocol |
|------|---------------|-------------|---------------|----------|
| hope-p2p | 26656 | 192.168.1.42 | 26656 | TCP |
| hope-rpc | 26657 | 192.168.1.42 | 26657 | TCP |

4. Set a **DHCP reservation** so the LAN IP never changes
5. Update `.env`:

```bash
EXTERNAL_ADDRESS=YOUR_PUBLIC_IP:26656
RPC_URL=http://YOUR_PUBLIC_IP:26657
```

6. Restart and verify:

```bash
./peer.sh restart
./peer.sh verify
```

---

## Optional: UPnP

Some routers support automatic mapping:

```bash
brew install miniupnpc   # macOS
./peer.sh upnp
./peer.sh verify
```

Many ISPs disable UPnP — manual forwarding is more reliable.

---

## Host firewall

Allow inbound TCP 26656 and 26657 on the machine running Docker:

- **macOS:** System Settings → Network → Firewall → Options
- **Linux:** `sudo ufw allow 26656/tcp && sudo ufw allow 26657/tcp`
- **Windows:** Windows Defender Firewall → Inbound rules

---

## CGNAT / no public IP

If your ISP uses carrier-grade NAT (no routable public IP):

- Run the peer on a **VPS** with a public IP — see [cloud-vps.md](cloud-vps.md)
- Or request a static/public IP from your ISP

Sync still works via gateway; incentives P2P checks will fail at home.

---

## Cloud VPS

On AWS, GCP, DigitalOcean, etc., open **26656** and **26657** in the **security group / firewall** instead of router port-forward. Auto-detect usually sets `EXTERNAL_ADDRESS` correctly.

---

## Verify reachability

```bash
./peer.sh verify
docker exec hope-peer /usr/local/bin/check-peer-reachability.sh
```

From another machine:

```bash
curl -s http://YOUR_PUBLIC_IP:26657/status | jq '.result.sync_info.catching_up'
```
