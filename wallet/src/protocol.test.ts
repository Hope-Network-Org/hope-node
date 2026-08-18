import assert from 'node:assert/strict';
import {
  assertHopeAccountAddress,
  assertOrigin,
  assertRelayUrl,
  createConnectRequest,
  createSignPayload,
  decodeSignPayload,
  encodeHopeAccountAddress,
  encodeSignPayload,
  isConnectRequestPayload,
  isHopeAccountAddress,
  isInlineSignPayload,
  assertHopeMnemonic,
} from './index.ts';

function throws(fn: () => unknown, include?: string) {
  let err: unknown;
  try {
    fn();
  } catch (e) {
    err = e;
  }
  assert.ok(err instanceof Error, 'expected throw');
  if (include) assert.match(err.message, new RegExp(include));
}

throws(() => assertHopeAccountAddress('not-an-address'), 'hope1');
throws(() => assertHopeAccountAddress('hope1zzzz'), 'hope1');
assert.equal(isHopeAccountAddress('bc1qnothope'), false);

const account = encodeHopeAccountAddress(new Uint8Array(20).fill(7));
assert.equal(isHopeAccountAddress(account), true);
assert.equal(assertHopeAccountAddress(account), account);

throws(() => assertOrigin({ name: 'X', url: 'http://example.com' }), 'HTTPS');
const origin = assertOrigin({ name: 'My App', url: 'https://my.app/path' });
assert.equal(origin.url, 'https://my.app');
assert.ok(
  assertRelayUrl('https://my.app/api/hope-wallet/sessions/abc/confirm', origin.url).startsWith(
    'https://my.app/'
  )
);
throws(() => assertRelayUrl('https://evil.test/confirm', origin.url), 'same origin');

const connect = createConnectRequest({
  chainId: 'hope-testnet-2',
  origin: { name: 'My App', url: 'https://my.app' },
});
assert.equal(isConnectRequestPayload(connect), true);
assert.equal(isInlineSignPayload(connect), false);

const sign = createSignPayload({
  origin: { name: 'My App', url: 'https://my.app' },
  account,
  preview: { title: 'Swap', summary: 'Execute swap' },
  messages: [
    {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: { sender: '', contract: account, msg: { swap: {} } },
    },
  ],
});
assert.equal(isInlineSignPayload(sign), true);
assert.equal(isConnectRequestPayload(sign as never), false);
assert.equal(decodeSignPayload(encodeSignPayload(sign)).account_hint, account);

throws(() => assertHopeMnemonic('too short'), '24');
throws(
  () =>
    assertHopeMnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    ),
  '24'
);

console.log('protocol tests ok');

