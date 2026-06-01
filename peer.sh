#!/usr/bin/env bash
# Hope testnet peer — Docker helper (pull published image, no chain repo required).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

ENV_FILE=()
[[ -f .env ]] && ENV_FILE=(--env-file .env)

compose() {
  docker compose "${ENV_FILE[@]}" "$@"
}

container_id() {
  docker ps -qf 'name=^hope-peer$' 2>/dev/null | head -1
}

ensure_image() {
  # shellcheck disable=SC1091
  [[ -f .env ]] && source .env
  local img="${HOPE_PEER_IMAGE:-public.ecr.aws/r8k0t0l9/hope-peer:testnet}"
  if docker image inspect "$img" &>/dev/null; then
    return 0
  fi
  echo "Pulling $img ..."
  docker pull "$img"
}

cmd_up() {
  ensure_image
  compose up -d
  echo ""
  echo "Peer starting. Watch: ./peer.sh logs"
  echo "Status:   ./peer.sh status"
}

cmd_down() {
  compose down
}

cmd_restart() {
  compose down
  compose up -d
  echo "Restarted. Data volume kept — node resumes sync from disk."
}

cmd_pull() {
  ensure_image
  echo "Image ready."
}

cmd_upgrade() {
  # shellcheck disable=SC1091
  [[ -f .env ]] && source .env
  local img="${HOPE_PEER_IMAGE:-public.ecr.aws/r8k0t0l9/hope-peer:testnet}"
  echo "Pulling latest $img ..."
  docker pull "$img"
  cmd_restart
  cmd_verify || true
}

cmd_fresh() {
  echo "=== Fresh start: remove container + volume, pull image, start ==="
  compose down -v 2>/dev/null || true
  docker rm -f hope-peer 2>/dev/null || true
  docker volume rm hope-peer-data 2>/dev/null || true
  ensure_image
  compose up -d
  echo "Peer starting from clean volume. Watch: ./peer.sh logs"
}

cmd_logs() {
  compose logs -f --tail=100
}

cmd_status() {
  local cid
  cid="$(container_id)"
  if [[ -z "$cid" ]]; then
    echo "Peer container is not running. Start with: ./peer.sh up"
    exit 1
  fi
  compose ps
  echo ""
  docker exec "$cid" /usr/local/bin/peer-incentives-status.sh 2>/dev/null || \
    docker exec "$cid" curl -sf http://127.0.0.1:26657/status | jq -r '
      .result.sync_info | "height: \(.latest_block_height)\ncatching_up: \(.catching_up)"'
}

cmd_reset() {
  echo "Stopping peer and wiping chain data (keeps operator keyring)..."
  compose down
  compose run --rm --entrypoint "" hope-peer \
    sh -c 'hoped comet unsafe-reset-all --home /home/hope/.hope'
  echo "Reset complete. Start with: ./peer.sh up"
}

cmd_resync() {
  echo "Fast resync via state sync (wipes block store, keeps keyring)..."
  compose down
  compose run --rm --entrypoint "" hope-peer \
    sh -c 'rm -f /home/hope/.hope/config/.synced_once; hoped comet unsafe-reset-all --home /home/hope/.hope'
  FORCE_STATE_SYNC=true STATE_SYNC=true compose up -d
  echo "State sync enabled. Follow: ./peer.sh logs"
}

cmd_ports() {
  bash "$DIR/scripts/port-forward-guide.sh"
}

cmd_upnp() {
  bash "$DIR/scripts/try-upnp-ports.sh"
}

cmd_verify() {
  local cid gw local cu drift=0 synced=0 fail=0
  cid="$(container_id)"
  [[ -n "$cid" ]] || { echo "FAIL: container not running"; exit 1; }

  local status
  status="$(docker exec "$cid" curl -sf http://127.0.0.1:26657/status)"
  local="$(echo "$status" | jq -r '.result.sync_info.latest_block_height // 0')"
  cu="$(echo "$status" | jq -r '.result.sync_info.catching_up // true')"
  gw="$(curl -sf https://test-gateway.hopenetwork.io/rpc/status | jq -r '.result.sync_info.latest_block_height // 0')"
  drift=$((gw - local))
  [[ "$drift" -lt 0 ]] && drift=$((-drift))

  echo "=== Verify ==="
  echo "local height:   $local (catching_up=$cu)"
  echo "gateway height: $gw (drift=$drift)"

  if [[ "$cu" == "false" && "$local" -gt 1000 ]]; then
    synced=1
  elif [[ "$local" -gt 1000 && "$drift" -le 50 ]]; then
    synced=1
  fi
  [[ "$synced" -eq 0 ]] && { echo "FAIL: not synced yet"; fail=1; }
  [[ "$drift" -gt 500 ]] && { echo "FAIL: lagging gateway by $drift blocks"; fail=1; }

  if docker logs "$cid" 2>&1 | tail -40 | grep -q 'wrong Block.Header.AppHash'; then
    echo "FAIL: AppHash mismatch — run ./peer.sh resync"
    fail=1
  fi

  docker exec "$cid" /usr/local/bin/check-peer-reachability.sh 2>/dev/null || \
    echo "WARN: public P2P/RPC not reachable — run ./peer.sh ports"

  [[ "$fail" -eq 0 ]] && echo "OK: peer verified" && exit 0
  exit 1
}

cmd_register() {
  local cid
  cid="$(container_id)"
  [[ -n "$cid" ]] || { echo "Start peer first: ./peer.sh up"; exit 1; }
  docker exec "$cid" /usr/local/bin/register-incentives.sh
}

cmd_sync_proof() {
  local cid
  cid="$(container_id)"
  [[ -n "$cid" ]] || { echo "Start peer first: ./peer.sh up"; exit 1; }
  docker exec "$cid" /usr/local/bin/submit-sync-proof.sh
}

cmd_shell() {
  local cid
  cid="$(container_id)"
  [[ -n "$cid" ]] || { echo "Start peer first: ./peer.sh up"; exit 1; }
  docker exec -it "$cid" bash
}

usage() {
  cat <<'EOF'
Hope testnet peer (Docker)

  ./peer.sh up         Start peer (pull image if needed)
  ./peer.sh down       Stop container (keeps volume)
  ./peer.sh restart    Recreate container (keeps data)
  ./peer.sh pull       Pull latest published image
  ./peer.sh upgrade    Pull latest + restart + verify
  ./peer.sh fresh      Wipe volume + pull + start (clean slate)
  ./peer.sh status     Sync + incentives eligibility dashboard
  ./peer.sh verify     Check sync, drift, reachability
  ./peer.sh logs       Follow container logs
  ./peer.sh ports      Router port-forward guide
  ./peer.sh upnp       Try UPnP auto-forward (optional)
  ./peer.sh resync     Wipe data + state-sync (fast catch-up)
  ./peer.sh reset      Wipe chain data; blocksync from genesis
  ./peer.sh register   Manual incentives register
  ./peer.sh sync-proof Submit one sync proof tx
  ./peer.sh shell      Shell inside container

Setup: cp .env.example .env  (optional HOPE_OPERATOR_MNEMONIC for incentives)
EOF
}

case "${1:-}" in
  up) cmd_up ;;
  down) cmd_down ;;
  restart) cmd_restart ;;
  pull) cmd_pull ;;
  upgrade) cmd_upgrade ;;
  fresh) cmd_fresh ;;
  logs) cmd_logs ;;
  status) cmd_status ;;
  verify) cmd_verify ;;
  ports) cmd_ports ;;
  upnp) cmd_upnp ;;
  reset) cmd_reset ;;
  resync) cmd_resync ;;
  register) cmd_register ;;
  sync-proof) cmd_sync_proof ;;
  shell) cmd_shell ;;
  -h|--help|help|"") usage ;;
  *) echo "Unknown command: $1"; usage; exit 1 ;;
esac
