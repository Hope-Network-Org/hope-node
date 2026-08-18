export {
  isHopeAccountAddress,
  assertHopeAccountAddress,
  encodeHopeAccountAddress,
} from './address';

export {
  type PayloadOrigin,
  assertOrigin,
  assertRelayUrl,
  defaultRelayUrl,
} from './origin';

export {
  DEFAULT_CHAIN_ID,
  PAIRING_TTL_MS,
  type ConnectRequestPayload,
  isConnectRequestPayload,
  createConnectRequest,
  encodeConnectPayload,
  decodeConnectPayload,
  buildConnectDeepLink,
  buildConnectQrContent,
  isConnectPayloadExpired,
  parseConnectUrl,
} from './payload';

export {
  type WalletMessage,
  type MessagePreview,
  type InlineSignPayload,
  isInlineSignPayload,
  createSignPayload,
  encodeSignPayload,
  decodeSignPayload,
  buildSignDeepLink,
  buildSignQrContent,
  isSignPayloadExpired,
} from './signPayload';

export { MAX_QR_CHARS, type QrBuildResult, buildQrDataUrl, qrDataUrl } from './qr';

export {
  type WalletVerifyStatus,
  type WalletProof,
  type WalletVerifyRow,
  parseWalletProof,
  rowToProof,
  walletConfirmBody,
} from './proof';

export {
  type WalletVerifyTransport,
  waitForWalletProof,
} from './transport';

export { createHttpTransport } from './httpTransport';
export { createSupabaseTransport, type RpcClient } from './supabaseTransport';

export {
  beginWalletVerification,
  completeWalletVerification,
  type WalletVerifySession,
} from './flow';

export { connect, type ConnectParams } from './connect';
export {
  message,
  createMessageSession,
  type MessageSession,
  type MessageResult,
} from './message';

export {
  isHopeWalletInApp,
  getHopeWalletActiveAddress,
  openHopeWalletDeepLink,
  requestMobileConnect,
  requestMobileSign,
} from './inApp';

export {
  HOPE_WALLET_PLAY_STORE,
  HOPE_WALLET_APP_STORE,
  HOPE_WALLET_IOS_LABEL,
} from './stores';

export { assertHopeMnemonic } from './mnemonic';
