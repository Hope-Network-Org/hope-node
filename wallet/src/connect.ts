import { assertHopeAccountAddress } from './address';
import {
  isHopeWalletInApp,
  openHopeWalletDeepLink,
  requestMobileConnect,
} from './inApp';
import {
  beginWalletVerification,
  type WalletVerifySession,
} from './flow';
import { encodeConnectPayload, isConnectPayloadExpired } from './payload';
import type { PayloadOrigin } from './origin';
import type { WalletProof } from './proof';
import { waitForWalletProof, type WalletVerifyTransport } from './transport';

export type ConnectParams = {
  origin: PayloadOrigin;
  chainId?: string;
  transport: WalletVerifyTransport;
  relayUrl?: string | true;
  expiresInMs?: number;
  signal?: AbortSignal;
  /** Called as soon as the QR/deep link exists (desktop UI). */
  onSession?: (session: WalletVerifySession) => void;
  /**
   * Open `hopewallet://` automatically. Default: only inside Hope Wallet’s
   * WebView. Mobile browsers (Discord, Safari) treat a hidden iframe open as an
   * app switch, remount the page, and mint a second `cs_…` session.
   */
  autoOpen?: boolean;
  /**
   * Distinct in-flight sessions (e.g. VerifyWalletPanel “Try again”). Same
   * origin + chain + relay reuse one pending `cs_…` until it settles.
   */
  reuseKey?: string;
};

type Flight = {
  sessionReady: Promise<WalletVerifySession>;
  proof: Promise<WalletProof>;
  pollAbort: AbortController;
};

const flights = new Map<string, Flight>();

function flightKey(params: ConnectParams): string {
  if (params.reuseKey) return params.reuseKey;
  const relay =
    params.relayUrl === true ? 'true' : params.relayUrl === undefined ? '' : params.relayUrl;
  return `${params.origin.url}|${params.chainId?.trim() || ''}|${relay}`;
}

function aborted(signal?: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    const fail = () => reject(new Error('Wallet verification wait aborted'));
    if (signal?.aborted) {
      fail();
      return;
    }
    signal?.addEventListener('abort', fail, { once: true });
  });
}

function shouldAutoOpen(autoOpen: boolean | undefined): boolean {
  if (autoOpen === true) return true;
  if (autoOpen === false) return false;
  return isHopeWalletInApp();
}

function startFlight(params: ConnectParams): Flight {
  const pollAbort = new AbortController();

  const sessionReady = beginWalletVerification({
    origin: params.origin,
    chainId: params.chainId,
    transport: params.transport,
    relayUrl: params.relayUrl,
    expiresInMs: params.expiresInMs,
  });

  const proof = sessionReady.then(async (session) => {
    const poll = waitForWalletProof({
      sessionId: session.payload.session_id,
      transport: params.transport,
      signal: pollAbort.signal,
    });

    const finish = async (next: WalletProof): Promise<WalletProof> => {
      pollAbort.abort();
      void poll.catch(() => undefined);
      return next;
    };

    if (shouldAutoOpen(params.autoOpen)) {
      openHopeWalletDeepLink(session.deepLink);
    }

    if (isHopeWalletInApp()) {
      try {
        const result = await requestMobileConnect(encodeConnectPayload(session.payload));
        return finish({
          sessionId: session.payload.session_id,
          address: assertHopeAccountAddress(result.address),
          pubkeyBase64: result.pubkeyBase64,
          accountLabel: result.accountLabel,
        });
      } catch {
        /* camera QR / Node deep-link still polling */
      }
    }

    return poll;
  });

  return { sessionReady, proof, pollAbort };
}

function getFlight(params: ConnectParams): Flight {
  const key = flightKey(params);
  const existing = flights.get(key);
  if (existing) return existing;
  const flight = startFlight(params);
  flights.set(key, flight);
  void flight.proof.finally(() => {
    if (flights.get(key) === flight) flights.delete(key);
  });
  return flight;
}

/** Test helper — drop in-flight connect() sessions. */
export function resetConnectFlights(): void {
  for (const flight of flights.values()) flight.pollAbort.abort();
  flights.clear();
}

/**
 * Prove a user controls a Hope account. In Hope Wallet WebView uses the native
 * overlay; otherwise hands off a connect QR. Never takes a mnemonic.
 *
 * Concurrent `connect()` calls for the same origin reuse one pending session so
 * React Strict Mode, Discord/Safari remounts, and double-taps cannot replace
 * the `cs_…` the wallet already opened.
 */
export async function connect(params: ConnectParams): Promise<WalletProof> {
  const flight = getFlight(params);
  const session = params.signal
    ? await Promise.race([flight.sessionReady, aborted(params.signal)])
    : await flight.sessionReady;
  if (isConnectPayloadExpired(session.payload)) {
    flights.delete(flightKey(params));
    return connect({ ...params, reuseKey: `${flightKey(params)}:${Date.now()}` });
  }
  params.onSession?.(session);
  return params.signal
    ? Promise.race([flight.proof, aborted(params.signal)])
    : flight.proof;
}
