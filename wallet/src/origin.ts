export interface PayloadOrigin {
  name: string;
  url: string;
}

function parseHttpUrl(value: string, label: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${label} must be http(s)`);
  }
  if (!parsed.hostname) {
    throw new Error(`${label} is missing a host`);
  }
  return parsed;
}

function isLoopback(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function assertOrigin(origin: PayloadOrigin): PayloadOrigin {
  const name = origin.name.trim();
  if (!name) throw new Error('origin.name is required');
  const url = parseHttpUrl(origin.url.trim(), 'origin.url');
  if (url.protocol === 'http:' && !isLoopback(url.hostname)) {
    throw new Error('origin.url must be HTTPS (http is only allowed on localhost)');
  }
  return { name, url: url.origin };
}

/**
 * Wallet-facing confirm URL. Must be HTTPS (or localhost) and the same origin as the app.
 */
export function assertRelayUrl(relayUrl: string, originUrl: string): string {
  const origin = parseHttpUrl(originUrl, 'origin.url');
  const relay = parseHttpUrl(relayUrl, 'relay_url');
  if (relay.protocol === 'http:' && !isLoopback(relay.hostname)) {
    throw new Error('relay_url must be HTTPS (http is only allowed on localhost)');
  }
  if (relay.origin !== origin.origin) {
    throw new Error('relay_url must be the same origin as origin.url');
  }
  if (relay.username || relay.password) {
    throw new Error('relay_url must not include credentials');
  }
  return relay.href;
}

/** Default confirm URL: `{origin}/api/hope-wallet/sessions/{id}/confirm` */
export function defaultRelayUrl(originUrl: string, sessionId: string): string {
  const origin = parseHttpUrl(originUrl, 'origin.url').origin;
  return `${origin}/api/hope-wallet/sessions/${encodeURIComponent(sessionId)}/confirm`;
}
