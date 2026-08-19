# `@hopenetwork/wallet`

```bash
npm install @hopenetwork/wallet
```

Connect a Hope account, send a transaction through Hope Wallet, or sign+broadcast yourself with a post-quantum mnemonic. One package, three paths.

| Path | Keys | UI | Result |
|------|------|----|--------|
| `connect()` | none | QR or in-app overlay | `hope1…` + pubkey |
| `message()` | none | QR or in-app overlay | wallet signs & broadcasts |
| `signAndBroadcast()` | 24-word mnemonic | none (Node only) | PQ signature + chain `txhash` |

QR images are drawn **locally** (`qrcode`). Never send payloads to a public QR CDN. Mnemonics **must not** be used in a webpage — `signAndBroadcast` throws if `window.document` exists.

## 1. Connect / verify (get the address)

In Hope Wallet’s in-app browser the native overlay is used. Otherwise a connect QR is shown (plus Open Hope Wallet + Play Store).

```ts
import { connect, createHttpTransport } from '@hopenetwork/wallet';

const transport = createHttpTransport({
  baseUrl: 'https://your.app/api/hope-wallet',
});

const { address, pubkeyBase64 } = await connect({
  origin: { name: 'My App', url: window.location.origin },
  chainId: 'hope-testnet-2',
  transport,
  relayUrl: true, // wallet POSTs proof to your origin
});
```

`connect()` reuses one pending `cs_…` for the same origin until it settles (React Strict Mode, Discord/Safari remounts, double-taps). It does **not** auto-open `hopewallet://` in a mobile browser — that app-switch remounts the page and replaces the session the wallet already opened. Pass `autoOpen: true` only if you want the old same-device handoff.

React:

```tsx
import { VerifyWalletPanel } from '@hopenetwork/wallet/react';

<VerifyWalletPanel
  origin={{ name: 'My App', url: window.location.origin }}
  transport={transport}
  relayUrl={true}
  onVerified={({ address }) => setAccount(address)}
/>
```

Same-origin confirm URL:

`POST {origin}/api/hope-wallet/sessions/{id}/confirm`

```json
{ "session_id": "cs_…", "address": "hope1…", "pubkey_base64": "…" }
```

Validate with `parseWalletProof`. Apps already on Hope Explorer Supabase can pass `createSupabaseTransport(supabase)` and omit `relayUrl`.

## 2. Message QR (custom tx after connect)

The user already has a verified `address`. You still never see their key. CosmWasm, bank, staking, gov — same `messages` array.

```ts
import { message } from '@hopenetwork/wallet';

const result = await message({
  origin: { name: 'My App', url: window.location.origin },
  chainId: 'hope-testnet-2',
  account: address,
  preview: { title: 'Join game', summary: 'sit_down on the table contract' },
  messages: [
    {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: {
        sender: address,
        contract: 'hope1…contract',
        msg: { sit_down: { table_id: '12' } },
        funds: [{ denom: 'uhope', amount: '1000000' }],
      },
    },
  ],
});

if (result.mode === 'in-app') {
  console.log('tx', result.txhash);
} else {
  // Desktop: show result.session.qrContent / deepLink (MessagePanel does this)
}
```

```tsx
import { MessagePanel } from '@hopenetwork/wallet/react';

<MessagePanel
  origin={{ name: 'My App', url: window.location.origin }}
  account={address}
  preview={{ title: 'Send', summary: '1 HOPE' }}
  messages={[
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: address,
        toAddress: recipient,
        amount: [{ denom: 'uhope', amount: '1000000' }],
      },
    },
  ]}
  onComplete={(r) => console.log(r)}
/>
```

Both connect and message auto-detect in-app vs QR. In Hope Wallet’s WebView the native overlay opens. On desktop/mobile web, scan the QR or tap **Open Hope Wallet** — the SDK does not inject a hidden `hopewallet://` iframe (that backgrounds Discord/Safari and mints a second session).

## 3. Mnemonic, PQ sign, broadcast (program / node)

**Node, scripts, operator backends only.** ML-DSA-65 via `@hope/pq` + `@hope/tx`.

```ts
import { signAndBroadcast } from '@hopenetwork/wallet/node';

const { address, txhash } = await signAndBroadcast({
  mnemonic: process.env.HOPE_MNEMONIC!,
  chainId: 'hope-testnet-2',
  lcd: 'https://test-gateway.hopenetwork.io/api',
  messages: [
    {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: {
        contract: 'hope1…',
        msg: { tick: {} },
      },
    },
  ],
});
```

Signer fields (`sender` / `fromAddress`) are overwritten from the mnemonic address. On-chain pubkey is checked against the derived key. Broadcast is `BROADCAST_MODE_SYNC` on LCD.

Install peers for this path: `@hope/pq` and `@hope/tx` (Hope’s ML-DSA packages). **Those are not on npm yet** — `connect()` / `message()` / `@hopenetwork/wallet/react` work from a public install; `./node` still needs those packages as local `file:` deps until they are published.

## Security

- Origin URLs must be HTTPS (http only on localhost).
- `relay_url` must be the same origin as the app; wallet rejects mismatches.
- Addresses are Bech32-checked (`hope1…`).
- Connect and sign payloads cannot be confused (`session_id` vs `preview`).
- QR payload cap is 2800 chars (rendered at 400 px for reliable camera decode); oversized sign requests keep Open Hope Wallet.
- Do not log mnemonics. Do not import `./node` from frontend bundles.

## Defaults

| | |
|--|--|
| Chain | `hope-testnet-2` |
| LCD | `https://test-gateway.hopenetwork.io/api` |
| QR TTL | 5 minutes |
| Android | `io.hopenetwork.wallet` on Google Play |
| iOS | not live yet |

## Layout

`WalletQrShell` / `GetHopeWallet`: QR stays visible; store links sit under it (connect **and** message). In-app hides the QR and asks the user to approve in the wallet overlay.

## Hosted nodes

Connect a customer Hope Wallet, authorize your operator hot key, update on-chain `payout_recipient`, and `MsgSend` leftover operator balances to that wallet: **[docs/hosted-nodes.md](docs/hosted-nodes.md)**.
