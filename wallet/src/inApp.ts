export interface MobileConnectResult {
  address: string;
  pubkeyBase64?: string;
  accountLabel?: string;
}

export interface MobileSignResult {
  txhash: string;
}

declare global {
  interface Window {
    __HOPE_WALLET_IN_APP__?: boolean;
    __HOPE_WALLET_ACTIVE_ADDRESS__?: string | null;
    HopeWalletMobile?: {
      isAvailable: boolean;
      requestConnect: (encodedPayload: string) => Promise<MobileConnectResult>;
      requestSign: (encodedPayload: string) => Promise<MobileSignResult>;
    };
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

/** True inside Hope Wallet / Hope Network Node WebView. */
export function isHopeWalletInApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.HopeWalletMobile?.isAvailable ||
      window.__HOPE_WALLET_IN_APP__ ||
      window.ReactNativeWebView
  );
}

/** True when the native JS bridge can show the in-app connect/sign sheet. */
export function isHopeWalletBridgeAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.HopeWalletMobile?.isAvailable);
}

/** Bridge inject runs before content load; connect() may race it on first paint. */
export async function waitForHopeWalletBridge(timeoutMs = 2500): Promise<boolean> {
  if (isHopeWalletBridgeAvailable()) return true;
  if (typeof window === 'undefined' || !window.ReactNativeWebView) return false;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50));
    if (isHopeWalletBridgeAvailable()) return true;
  }
  return false;
}

export function getHopeWalletActiveAddress(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const addr = window.__HOPE_WALLET_ACTIVE_ADDRESS__;
  return typeof addr === 'string' && addr.length > 0 ? addr : undefined;
}

export async function requestMobileConnect(
  encodedPayload: string
): Promise<MobileConnectResult> {
  const bridge = typeof window !== 'undefined' ? window.HopeWalletMobile : undefined;
  if (!bridge?.isAvailable) {
    throw new Error('Hope Wallet in-app bridge is not available');
  }
  return bridge.requestConnect(encodedPayload);
}

export async function requestMobileSign(
  encodedPayload: string
): Promise<MobileSignResult> {
  const bridge = typeof window !== 'undefined' ? window.HopeWalletMobile : undefined;
  if (!bridge?.isAvailable) {
    throw new Error('Hope Wallet in-app bridge is not available');
  }
  return bridge.requestSign(encodedPayload);
}

/**
 * Hand off `hopewallet://` to Hope Wallet. In the in-app WebView, posts to the
 * native bridge (bottom sheet) instead of navigating — `location.assign` can
 * escape to the OS Linking handler and leave the browser.
 */
export function openHopeWalletDeepLink(deepLink: string): void {
  if (typeof window === 'undefined' || !deepLink.startsWith('hopewallet://')) return;
  if (window.__HOPE_WALLET_IN_APP__ || window.ReactNativeWebView) {
    const postMessage = window.ReactNativeWebView?.postMessage;
    if (postMessage) {
      postMessage(JSON.stringify({ type: 'hopewallet_deeplink', url: deepLink }));
      return;
    }
  }
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.documentElement.appendChild(iframe);
    window.setTimeout(() => {
      try {
        document.documentElement.removeChild(iframe);
      } catch {
        /* ignore */
      }
    }, 500);
  } catch {
    try {
      window.location.href = deepLink;
    } catch {
      /* ignore */
    }
  }
}
