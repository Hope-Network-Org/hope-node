/** Shared types for NerdNode payout authorization + update flow. */

export const TYPE_URL_MSG_AUTHORIZE_OPERATOR =
  '/hope.incentives.v1.MsgAuthorizeOperator';

export const DEFAULT_CHAIN_ID = 'hope-testnet-2';
export const DEFAULT_LCD_BASE = 'https://test-gateway.hopenetwork.io/api';
export const DEFAULT_RPC = 'https://test-gateway.hopenetwork.io/rpc/';

export interface PayloadOrigin {
  name: string;
  url: string;
  icon?: string;
}

export interface PayloadWalletMessage {
  typeUrl: string;
  value: Record<string, unknown>;
}

export interface InlineSignPayload {
  id: string;
  chain_id: string;
  expires_at: string;
  origin: PayloadOrigin;
  account_hint?: string;
  preview: {
    title: string;
    summary: string;
    messages: Array<{
      type: string;
      from?: string;
      to?: string;
      amount?: string;
      denom?: string;
      summary?: string;
    }>;
    fee?: { amount: string; denom: string; gas: string };
  };
  return_url?: string;
  transaction?: {
    memo?: string;
    messages: PayloadWalletMessage[];
  };
}

export interface OperatorAuthorization {
  payout_recipient?: string;
  payoutRecipient?: string;
  operator: string;
  label?: string;
  authorized_at?: string;
  authorizedAt?: string;
}

export interface AuthorizePayoutParams {
  chainId?: string;
  origin: PayloadOrigin;
  /** Hot-key / node operator address (hope1…) */
  operatorAddress: string;
  /** Cold wallet that will receive rewards and must sign authorize */
  payoutAddress: string;
  label?: string;
  returnUrl?: string;
}

export interface HostFollowUpCommands {
  updateNode: string;
  bankSendAll: string;
  bankSendAmount: (amountUhope: string) => string;
  setEnvHint: string;
}
