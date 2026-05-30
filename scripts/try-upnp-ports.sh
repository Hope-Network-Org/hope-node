#!/usr/bin/env bash
# Optional UPnP port mapping (some home routers only).
set -euo pipefail

P2P_PORT="${P2P_PORT:-26656}"
RPC_PORT="${RPC_PORT:-26657}"

if ! command -v upnpc &>/dev/null; then
  echo "upnpc not installed."
  echo "  macOS:   brew install miniupnpc"
  echo "  Debian:  sudo apt install miniupnpc"
  exit 1
fi

LAN_IP=""
if [[ "$(uname -s)" == "Darwin" ]]; then
  LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
else
  LAN_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1); exit}')"
fi

echo "UPnP: mapping TCP ${P2P_PORT} and ${RPC_PORT}..."
upnpc -e || true
upnpc -a "${LAN_IP}" "${P2P_PORT}" "${P2P_PORT}" TCP 86400 "hope-p2p" || true
upnpc -a "${LAN_IP}" "${RPC_PORT}" "${RPC_PORT}" TCP 86400 "hope-rpc" || true
echo "Done. Verify: ./peer.sh verify"
