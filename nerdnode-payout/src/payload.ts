import {
  DEFAULT_CHAIN_ID,
  TYPE_URL_MSG_AUTHORIZE_OPERATOR,
  type AuthorizePayoutParams,
  type InlineSignPayload,
} from './types';

const TTL_MS = 5 * 60 * 1000;

export function needsAuthorize(
  operatorAddress: string,
  payoutAddress: string
): boolean {
  return (
    Boolean(operatorAddress) &&
    Boolean(payoutAddress) &&
    operatorAddress.trim().toLowerCase() !== payoutAddress.trim().toLowerCase()
  );
}

export function createAuthorizeOperatorPayload(
  params: AuthorizePayoutParams
): InlineSignPayload {
  const payout = params.payoutAddress.trim();
  const operator = params.operatorAddress.trim();
  const label = params.label?.trim() || 'nerdnode';

  if (!payout.startsWith('hope1') || !operator.startsWith('hope1')) {
    throw new Error('operatorAddress and payoutAddress must be hope1… addresses');
  }
  if (!needsAuthorize(operator, payout)) {
    throw new Error(
      'Authorization is only required when payout wallet differs from operator'
    );
  }

  return {
    id: `pl_${Date.now().toString(36)}`,
    chain_id: params.chainId ?? DEFAULT_CHAIN_ID,
    expires_at: new Date(Date.now() + TTL_MS).toISOString(),
    origin: params.origin,
    account_hint: payout,
    return_url: params.returnUrl,
    preview: {
      title: 'Authorize node operator',
      summary: `Allow ${operator.slice(0, 12)}… to route node rewards to this wallet`,
      messages: [
        {
          type: 'incentives/authorize_operator',
          from: payout,
          to: operator,
          summary: `Authorize operator ${operator.slice(0, 14)}…`,
        },
      ],
      fee: { amount: '5000', denom: 'uhope', gas: '400000' },
    },
    transaction: {
      memo: '',
      messages: [
        {
          typeUrl: TYPE_URL_MSG_AUTHORIZE_OPERATOR,
          value: {
            payoutRecipient: payout,
            payout_recipient: payout,
            operator,
            label,
          },
        },
      ],
    },
  };
}

export function encodePayload(payload: InlineSignPayload): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function buildSignDeepLink(payload: InlineSignPayload): string {
  const p = encodeURIComponent(encodePayload(payload));
  return `hopewallet://sign?p=${p}`;
}

/** Content to put in the QR (deep link). */
export function buildSignQrContent(payload: InlineSignPayload): string {
  return buildSignDeepLink(payload);
}

export function qrImageUrl(content: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(content)}`;
}
