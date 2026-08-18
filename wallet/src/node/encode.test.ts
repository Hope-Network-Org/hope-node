import assert from 'node:assert/strict';
import { TYPE_URL_MSG_UPDATE_NODE } from '@hope/tx';
import { encodeWalletMessage } from './encode.ts';

const signer = 'hope1operator';
const payout = 'hope1payout';

const encoded = encodeWalletMessage(
  {
    typeUrl: '/hope.incentives.v1.MsgUpdateNode',
    value: {
      operator: 'ignored-operator',
      payoutRecipient: payout,
    },
  },
  signer
);
const text = new TextDecoder().decode(encoded);
assert.ok(text.includes(TYPE_URL_MSG_UPDATE_NODE), 'encodes MsgUpdateNode type URL');
assert.ok(text.includes(signer), 'bindSigner overwrites operator to mnemonic address');
assert.ok(text.includes(payout), 'keeps payoutRecipient');
assert.equal(text.includes('ignored-operator'), false, 'does not keep caller operator');

assert.throws(
  () =>
    encodeWalletMessage(
      { typeUrl: '/hope.incentives.v1.MsgNotAThing', value: {} },
      signer
    ),
  /Unsupported message type/
);

console.log('encode.test.ts ok');
