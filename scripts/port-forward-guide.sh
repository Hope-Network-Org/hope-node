#!/usr/bin/env bash
# Print LAN/public IPs and router port-forward steps for Hope peer (run on the Docker host).
set -euo pipefail

P2P_PORT="${P2P_PORT:-26656}"
RPC_PORT="${RPC_PORT:-26657}"

detect_lan_ip() {
  if command -v ip &>/dev/null; then
    ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1); exit}'
  elif [[ "$(uname -s)" == "Darwin" ]]; then
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true
  else
    hostname -I 2>/dev/null | awk '{print $1}'
  fi
}

detect_public_ip() {
  curl -fsSL --max-time 5 https://api.ipify.org 2>/dev/null \
    || curl -fsSL --max-time 5 https://ifconfig.me/ip 2>/dev/null \
    || true
}

LAN_IP="$(detect_lan_ip)"
PUB_IP="$(detect_public_ip)"

if [[ -f .env ]]; then
  EXT_LINE="$(grep -E '^EXTERNAL_ADDRESS=' .env 2>/dev/null | tail -1 || true)"
  EXTERNAL_ADDRESS="${EXT_LINE#EXTERNAL_ADDRESS=}"
  EXTERNAL_ADDRESS="${EXTERNAL_ADDRESS%\"}"
  EXTERNAL_ADDRESS="${EXTERNAL_ADDRESS#\"}"
fi
EXT_HOST="${EXTERNAL_ADDRESS%:*}"
[[ -z "$EXT_HOST" || "$EXT_HOST" == "your.public.ip" ]] && EXT_HOST="${PUB_IP:-<your-public-ip>}"

echo "=============================================="
echo " Hope peer — port forwarding (Docker host)"
echo "=============================================="
echo ""
echo "Docker publishes on THIS machine:"
echo "  ${P2P_PORT}/tcp  (P2P)"
echo "  ${RPC_PORT}/tcp  (RPC)"
echo ""
printf "  %-18s %s\n" "LAN IP:" "${LAN_IP:-unknown}"
printf "  %-18s %s\n" "Public IP:" "${PUB_IP:-unknown}"
printf "  %-18s %s\n" "EXTERNAL_ADDRESS:" "${EXT_HOST}:${P2P_PORT}"
echo ""
echo "Forward BOTH TCP ports on your router to ${LAN_IP:-YOUR_PC_LAN_IP}"
echo "Then: ./peer.sh restart && ./peer.sh verify"
echo ""
echo "Full guide: docs/port-forwarding.md"
