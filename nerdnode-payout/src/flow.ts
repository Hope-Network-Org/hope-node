import {
  buildSignDeepLink,
  buildSignQrContent,
  createAuthorizeOperatorPayload,
  needsAuthorize,
  qrImageUrl,
} from './payload';
import {
  fetchOperatorAuthorizations,
  isOperatorAuthorized,
  waitForOperatorAuthorization,
} from './poll';
import { buildHostFollowUpCommands } from './commands';
import type { AuthorizePayoutParams, InlineSignPayload } from './types';

export type PayoutSetupPhase =
  | 'ready'
  | 'awaiting_wallet'
  | 'authorized'
  | 'skipped_same_wallet';

export interface PayoutSetupSession {
  phase: PayoutSetupPhase;
  payoutAddress: string;
  operatorAddress: string;
  payload: InlineSignPayload | null;
  deepLink: string | null;
  qrContent: string | null;
  qrUrl: string | null;
  alreadyAuthorized: boolean;
}

/**
 * One-shot setup for NerdNode UI:
 * - same wallet → skip QR
 * - different wallet → build Hope Wallet sign QR + optionally wait on-chain
 */
export async function preparePayoutSetup(
  params: AuthorizePayoutParams & { lcdBase?: string }
): Promise<PayoutSetupSession> {
  const operatorAddress = params.operatorAddress.trim();
  const payoutAddress = params.payoutAddress.trim();

  if (!needsAuthorize(operatorAddress, payoutAddress)) {
    return {
      phase: 'skipped_same_wallet',
      payoutAddress,
      operatorAddress,
      payload: null,
      deepLink: null,
      qrContent: null,
      qrUrl: null,
      alreadyAuthorized: true,
    };
  }

  const existing = await fetchOperatorAuthorizations(payoutAddress, params.lcdBase);
  if (isOperatorAuthorized(existing, operatorAddress)) {
    return {
      phase: 'authorized',
      payoutAddress,
      operatorAddress,
      payload: null,
      deepLink: null,
      qrContent: null,
      qrUrl: null,
      alreadyAuthorized: true,
    };
  }

  const payload = createAuthorizeOperatorPayload(params);
  const deepLink = buildSignDeepLink(payload);
  const qrContent = buildSignQrContent(payload);

  return {
    phase: 'awaiting_wallet',
    payoutAddress,
    operatorAddress,
    payload,
    deepLink,
    qrContent,
    qrUrl: qrImageUrl(qrContent),
    alreadyAuthorized: false,
  };
}

export async function completePayoutAuthorization(params: {
  payoutAddress: string;
  operatorAddress: string;
  lcdBase?: string;
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  containerName?: string;
  label?: string;
}) {
  const auth = await waitForOperatorAuthorization(params);
  const commands = buildHostFollowUpCommands({
    payoutAddress: params.payoutAddress,
    containerName: params.containerName,
    label: params.label,
  });
  return { authorization: auth, commands };
}
