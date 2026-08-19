import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import {
  createSignPayload,
  encodeHopeAccountAddress,
  encodeSignPayload,
  buildSignQrContent,
} from './index.ts';
import {
  QR_ECC_M_MIN_CHARS,
  qrDisplaySize,
} from './qr.ts';

const account = encodeHopeAccountAddress(new Uint8Array(20).fill(3));

const sign = createSignPayload({
  origin: { name: 'Test', url: 'https://test.app' },
  account,
  preview: { title: 'Send', summary: '1 HOPE' },
  messages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: account,
        toAddress: account,
        amount: [{ denom: 'uhope', amount: '1000000' }],
      },
    },
  ],
});

const qrContent = buildSignQrContent(sign);
assert.ok(qrContent.length >= QR_ECC_M_MIN_CHARS, 'sign QR should use ECC M path');
assert.equal(qrDisplaySize(qrContent, 400), 480);

const qr = QRCode.create(qrContent, { errorCorrectionLevel: 'M' });
assert.ok(qr.modules.size >= 85, 'sign QR is denser than connect');

const roundtrip = JSON.parse(
  Buffer.from(encodeSignPayload(sign), 'base64').toString('utf8')
) as { account_hint?: string };
assert.equal(roundtrip.account_hint, sign.account_hint);

console.log('qr.test.ts ok', { len: qrContent.length, modules: qr.modules.size });
