/**
 * Drop-in HTTP handlers for Hope Wallet connect (same origin as the page).
 *
 * Mount on any Node server (Express, connect, Vite middleware, http.createServer):
 *
 *   import { handleHopeWalletSessions } from './sessions';
 *   app.use((req, res, next) => { void handleHopeWalletSessions(req, res, next); });
 *
 * Routes:
 *   POST   /api/hope-wallet/sessions
 *   GET    /api/hope-wallet/sessions/:id
 *   DELETE /api/hope-wallet/sessions/:id
 *   POST   /api/hope-wallet/sessions/:id/confirm
 *
 * Swap the Map for Redis in production if you run more than one app server.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

type SessionRow = {
  session_id: string;
  status: 'pending' | 'connected' | 'cancelled';
  address: string | null;
  pubkey_base64: string | null;
  account_label: string | null;
  connected_at: string | null;
  expires_at: string;
};

const sessions = new Map<string, SessionRow>();
const TTL_MS = 5 * 60 * 1000;

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function parseProof(body: unknown, sessionId: string) {
  if (!body || typeof body !== 'object') throw new Error('Wallet proof must be JSON');
  const o = body as Record<string, unknown>;
  const address = typeof o.address === 'string' ? o.address.trim() : '';
  if (!address.startsWith('hope1') || address.length < 20) {
    throw new Error('address must be a hope1… Bech32 account');
  }
  const given =
    (typeof o.session_id === 'string' && o.session_id) ||
    (typeof o.sessionId === 'string' && o.sessionId) ||
    sessionId;
  if (given !== sessionId) throw new Error('session_id mismatch');
  return {
    address,
    pubkey_base64:
      (typeof o.pubkey_base64 === 'string' && o.pubkey_base64) ||
      (typeof o.pubkeyBase64 === 'string' && o.pubkeyBase64) ||
      null,
    account_label:
      (typeof o.account_label === 'string' && o.account_label) ||
      (typeof o.accountLabel === 'string' && o.accountLabel) ||
      null,
  };
}

export async function handleHopeWalletSessions(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  if (!url.pathname.startsWith('/api/hope-wallet')) {
    next();
    return;
  }

  try {
    const method = req.method ?? 'GET';

    if (method === 'POST' && url.pathname === '/api/hope-wallet/sessions') {
      const body = (await readJson(req)) as { session_id?: string; expires_at?: string };
      const sessionId = body.session_id?.trim();
      if (!sessionId) {
        json(res, 400, { error: 'session_id is required' });
        return;
      }
      sessions.set(sessionId, {
        session_id: sessionId,
        status: 'pending',
        address: null,
        pubkey_base64: null,
        account_label: null,
        connected_at: null,
        expires_at: body.expires_at ?? new Date(Date.now() + TTL_MS).toISOString(),
      });
      json(res, 200, { ok: true, session_id: sessionId });
      return;
    }

    const match = url.pathname.match(
      /^\/api\/hope-wallet\/sessions\/([^/]+)(?:\/(confirm))?$/
    );
    if (!match) {
      json(res, 404, { error: 'unknown wallet route' });
      return;
    }

    const sessionId = decodeURIComponent(match[1]);
    const confirm = match[2] === 'confirm';
    const row = sessions.get(sessionId);

    if (method === 'GET' && !confirm) {
      if (!row) {
        json(res, 404, { error: 'not found' });
        return;
      }
      json(res, 200, row);
      return;
    }

    if (method === 'DELETE' && !confirm) {
      if (row) row.status = 'cancelled';
      json(res, 200, { ok: true });
      return;
    }

    if (method === 'POST' && confirm) {
      if (!row || row.status === 'cancelled') {
        json(res, 404, { error: 'session not found' });
        return;
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        json(res, 400, { error: 'session expired' });
        return;
      }
      const proof = parseProof(await readJson(req), sessionId);
      row.status = 'connected';
      row.address = proof.address;
      row.pubkey_base64 = proof.pubkey_base64;
      row.account_label = proof.account_label;
      row.connected_at = new Date().toISOString();
      json(res, 200, { ok: true });
      return;
    }

    json(res, 405, { error: 'method not allowed' });
  } catch (e) {
    json(res, 400, { error: e instanceof Error ? e.message : 'relay error' });
  }
}
