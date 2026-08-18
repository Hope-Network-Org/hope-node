import assert from 'node:assert/strict';
import { connect, resetConnectFlights } from './connect.ts';
import { encodeHopeAccountAddress } from './address.ts';
import type { ConnectRequestPayload } from './payload.ts';
import type { WalletVerifyRow, WalletVerifyTransport } from './index.ts';

const origin = { name: 'Test App', url: 'https://verify.test' };
const address = encodeHopeAccountAddress(new Uint8Array(20).fill(7));

function mockTransport(): WalletVerifyTransport & {
  creates: string[];
  confirm: (sessionId: string) => void;
} {
  const rows = new Map<string, WalletVerifyRow>();
  const creates: string[] = [];
  return {
    creates,
    async create(payload: ConnectRequestPayload) {
      creates.push(payload.session_id);
      rows.set(payload.session_id, {
        session_id: payload.session_id,
        status: 'pending',
        address: null,
        pubkey_base64: null,
        account_label: null,
        connected_at: null,
      });
    },
    async get(sessionId: string) {
      return rows.get(sessionId) ?? null;
    },
    confirm(sessionId: string) {
      const row = rows.get(sessionId);
      if (!row) throw new Error('missing session');
      rows.set(sessionId, {
        ...row,
        status: 'connected',
        address,
        connected_at: new Date().toISOString(),
      });
    },
  };
}

async function started(
  params: Parameters<typeof connect>[0]
): Promise<{ sessionId: string; done: Promise<unknown> }> {
  let sessionId = '';
  const done = connect({
    ...params,
    onSession: (s) => {
      sessionId = s.payload.session_id;
      params.onSession?.(s);
    },
  });
  const t0 = Date.now();
  while (!sessionId) {
    if (Date.now() - t0 > 10_000) throw new Error('timed out waiting for session');
    await new Promise((r) => setTimeout(r, 10));
  }
  return { sessionId, done };
}

resetConnectFlights();

{
  const transport = mockTransport();
  const a = await started({ origin, transport, relayUrl: true });
  const b = await started({ origin, transport, relayUrl: true });
  assert.equal(a.sessionId, b.sessionId);
  assert.equal(transport.creates.length, 1, 'parallel connect() must mint one session');
  transport.confirm(a.sessionId);
  const [proofA, proofB] = await Promise.all([a.done, b.done]);
  assert.equal((proofA as { sessionId: string }).sessionId, a.sessionId);
  assert.equal((proofB as { sessionId: string }).sessionId, a.sessionId);
  resetConnectFlights();
}

{
  const transport = mockTransport();
  const ac = new AbortController();
  const first = await started({ origin, transport, relayUrl: true, signal: ac.signal });
  ac.abort();
  await assert.rejects(first.done, /aborted/);
  assert.equal(transport.creates.length, 1);

  const second = await started({ origin, transport, relayUrl: true });
  assert.equal(second.sessionId, first.sessionId);
  assert.equal(transport.creates.length, 1, 'aborted waiter must not replace the pending cs_');
  transport.confirm(first.sessionId);
  const proof = await second.done;
  assert.equal((proof as { sessionId: string }).sessionId, first.sessionId);
  resetConnectFlights();
}

{
  const transport = mockTransport();
  const first = await started({ origin, transport, relayUrl: true });
  transport.confirm(first.sessionId);
  await first.done;
  const second = await started({ origin, transport, relayUrl: true });
  assert.equal(transport.creates.length, 2, 'a finished connect may mint a new session');
  assert.notEqual(second.sessionId, first.sessionId);
  transport.confirm(second.sessionId);
  await second.done;
  resetConnectFlights();
}

console.log('connect tests ok');
