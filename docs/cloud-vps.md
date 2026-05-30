# Cloud / VPS deployment

Running on a VPS is the **recommended** setup for incentives — you get a stable public IP without home router configuration.

## Minimum VPS spec

| Resource | Value |
|----------|-------|
| vCPU | 2 |
| RAM | 4 GB |
| Disk | 40 GB SSD |
| OS | Ubuntu 22.04+ or Amazon Linux 2023 |

---

## Install Docker

**Ubuntu:**

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in
```

**Amazon Linux 2023:**

```bash
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

---

## Security group / firewall

Allow inbound:

| Port | Source | Purpose |
|------|--------|---------|
| 22 | Your IP | SSH (optional) |
| 26656 | 0.0.0.0/0 | P2P |
| 26657 | 0.0.0.0/0 | RPC |

---

## Deploy

### Option A — git + compose (recommended)

```bash
git clone https://github.com/Hope-Network-Org/hope-node.git
cd hope-node
cp .env.example .env
# Edit: HOPE_OPERATOR_MNEMONIC, NODE_LABEL
chmod +x peer.sh scripts/*.sh
./peer.sh up
./peer.sh status
```

### Option B — docker run only

```bash
docker run -d --name hope-peer --restart unless-stopped \
  -p 26656:26656 -p 26657:26657 \
  -v hope-peer-data:/home/hope/.hope \
  -e HOPE_OPERATOR_MNEMONIC="your twenty four words" \
  -e NODE_LABEL=vps-us-east-1 \
  public.ecr.aws/r8k0t0l9/hope-peer:testnet
```

Public IP is auto-detected on EC2 and most cloud providers.

---

## AWS EC2 example

1. Launch **t3.small** (or larger), **40 GB** gp3
2. Security group: TCP 26656, 26657 from anywhere
3. SSH in, install Docker, run compose or `docker run`
4. Check RPC: `http://<PUBLIC_IP>:26657/status`

---

## Maintenance

```bash
./peer.sh upgrade   # Pull latest image + restart
./peer.sh logs
./peer.sh verify
```

Enable unattended upgrades for the **host OS** separately; the Hope container uses `--restart unless-stopped`.

---

## Monitoring

```bash
# Cron example: alert if verify fails
*/15 * * * * cd /opt/hope-node && ./peer.sh verify || logger "hope-peer verify failed"
```

JSON status for external monitoring:

```bash
docker exec hope-peer /usr/local/bin/peer-incentives-status.sh --json
```

---

## Related

- [Quick start](quick-start.md)
- [Incentives](incentives.md)
- [Troubleshooting](troubleshooting.md)
