# Browser relay (volunteer RPC layer)

Hope apps can route **read-only** JSON-RPC through volunteer browser tabs via a small WebSocket relay on each public mirror. This is separate from CometBFT P2P (`:26656`) and the HTTP RPC pool.

**Ops checklist:** [hope-smart-rpc relay deploy GO-LIVE](https://github.com/Hope-Network-Org/hope-node/blob/main/packages/hope-smart-rpc/relay/deploy/GO-LIVE.md) (nginx + `node dist/relay/server.js` on gateway and test-rpc-2).

**Contributors:** [hope-browser-node](https://github.com/Hope-Network-Org/hope-node) `/browser` tab.

**Health:** `https://test-gateway.hopenetwork.io/browser-relay/health` (after nginx is configured).
