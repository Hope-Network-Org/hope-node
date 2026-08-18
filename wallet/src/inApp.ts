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
 * Hand off `hopewallet://` to the OS / in-app intercept (same device, no camera).
 */
export function openHopeWalletDeepLink(deepLink: string): void {
  if (typeof window === 'undefined' || !deepLink.startsWith('hopewallet://')) return;
  if (window.__HOPE_WALLET_IN_APP__) {
    try {
      window.location.assign(deepLink);
      return;
    } catch {
      window.location.href = deepLink;
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
