import {
  encodeMsgAuthorizeOperator,
  encodeMsgDelegate,
  encodeMsgExecuteContract,
  encodeMsgSend,
  encodeMsgUndelegate,
  encodeMsgUpdateNode,
  encodeMsgVote,
  encodeMsgWithdrawDelegatorReward,
  GovVoteOption,
  TYPE_URL_MSG_AUTHORIZE_OPERATOR,
  TYPE_URL_MSG_UPDATE_NODE,
} from '@hope/tx';
import type { WalletMessage } from '../signPayload';

function readString(value: Record<string, unknown>, camel: string, snake: string): string {
  const v = value[camel] ?? value[snake];
  return typeof v === 'string' ? v : '';
}

function readFunds(value: Record<string, unknown>): Array<{ denom: string; amount: string }> {
  const raw = value.funds;
  if (!Array.isArray(raw)) return [];
  return raw.map((coin) => {
    const c = coin as Record<string, unknown>;
    return {
      denom: String(c.denom ?? 'uhope'),
      amount: String(c.amount ?? '0'),
    };
  });
}

function wasmMsgBytes(value: Record<string, unknown>): Uint8Array {
  const raw = value.msg ?? value.msg_base64;
  if (typeof raw === 'string') {
    try {
      const binary = atob(raw);
      const out = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
      return out;
    } catch {
      return new TextEncoder().encode(raw);
    }
  }
  if (raw && typeof raw === 'object') {
    return new TextEncoder().encode(JSON.stringify(raw));
  }
  throw new Error('MsgExecuteContract requires msg (JSON object or base64)');
}

function bindSigner(msg: WalletMessage, signer: string): WalletMessage {
  const value = { ...msg.value };
  const typeUrl = msg.typeUrl;
  if (typeUrl === '/cosmos.bank.v1beta1.MsgSend') {
    value.fromAddress = signer;
    value.from_address = signer;
  } else if (typeUrl.includes('MsgExecuteContract')) {
    value.sender = signer;
  } else if (typeUrl.includes('MsgDelegate') || typeUrl.includes('MsgUndelegate')) {
    value.delegatorAddress = signer;
    value.delegator_address = signer;
  } else if (typeUrl.includes('MsgWithdrawDelegatorReward')) {
    value.delegatorAddress = signer;
    value.delegator_address = signer;
  } else if (typeUrl.includes('MsgVote')) {
    value.voter = signer;
  } else if (
    typeUrl === TYPE_URL_MSG_AUTHORIZE_OPERATOR ||
    typeUrl.includes('MsgAuthorizeOperator')
  ) {
    value.payoutRecipient = signer;
    value.payout_recipient = signer;
  } else if (
    typeUrl === TYPE_URL_MSG_UPDATE_NODE ||
    typeUrl.includes('MsgUpdateNode')
  ) {
    value.operator = signer;
  }
  return { typeUrl, value };
}

export function encodeWalletMessage(msg: WalletMessage, signerAddress: string): Uint8Array {
  const bound = bindSigner(msg, signerAddress);
  const v = bound.value;
  const typeUrl = bound.typeUrl;

  if (typeUrl === '/cosmos.bank.v1beta1.MsgSend') {
    const amountList =
      (v.amount as Array<{ denom: string; amount: string }>) ?? [];
    const coin = amountList[0] ?? { denom: 'uhope', amount: '0' };
    return encodeMsgSend({
      fromAddress: readString(v, 'fromAddress', 'from_address'),
      toAddress: readString(v, 'toAddress', 'to_address'),
      denom: coin.denom,
      amount: coin.amount,
    });
  }

  if (typeUrl === '/cosmwasm.wasm.v1.MsgExecuteContract') {
    return encodeMsgExecuteContract({
      sender: readString(v, 'sender', 'sender'),
      contract: readString(v, 'contract', 'contract'),
      msg: wasmMsgBytes(v),
      funds: readFunds(v),
    });
  }

  if (typeUrl === '/cosmos.staking.v1beta1.MsgDelegate') {
    const amount =
      (v.amount as { denom?: string; amount?: string }) ?? {};
    return encodeMsgDelegate({
      delegatorAddress: readString(v, 'delegatorAddress', 'delegator_address'),
      validatorAddress: readString(v, 'validatorAddress', 'validator_address'),
      denom: String(amount.denom ?? 'uhope'),
      amount: String(amount.amount ?? '0'),
    });
  }

  if (typeUrl === '/cosmos.staking.v1beta1.MsgUndelegate') {
    const amount =
      (v.amount as { denom?: string; amount?: string }) ?? {};
    return encodeMsgUndelegate({
      delegatorAddress: readString(v, 'delegatorAddress', 'delegator_address'),
      validatorAddress: readString(v, 'validatorAddress', 'validator_address'),
      denom: String(amount.denom ?? 'uhope'),
      amount: String(amount.amount ?? '0'),
    });
  }

  if (typeUrl === '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward') {
    return encodeMsgWithdrawDelegatorReward({
      delegatorAddress: readString(v, 'delegatorAddress', 'delegator_address'),
      validatorAddress: readString(v, 'validatorAddress', 'validator_address'),
    });
  }

  if (typeUrl === '/cosmos.gov.v1.MsgVote') {
    return encodeMsgVote({
      voter: readString(v, 'voter', 'voter'),
      proposalId: String(v.proposalId ?? v.proposal_id ?? '0'),
      option: Number(v.option ?? GovVoteOption.UNSPECIFIED) as GovVoteOption,
    });
  }

  if (
    typeUrl === TYPE_URL_MSG_AUTHORIZE_OPERATOR ||
    typeUrl === '/hope.incentives.v1.MsgAuthorizeOperator'
  ) {
    return encodeMsgAuthorizeOperator({
      payoutRecipient: readString(v, 'payoutRecipient', 'payout_recipient'),
      operator: readString(v, 'operator', 'operator'),
      label: readString(v, 'label', 'label') || undefined,
    });
  }

  if (typeUrl === TYPE_URL_MSG_UPDATE_NODE || typeUrl === '/hope.incentives.v1.MsgUpdateNode') {
    return encodeMsgUpdateNode({
      operator: readString(v, 'operator', 'operator'),
      label: readString(v, 'label', 'label') || undefined,
      payoutRecipient: readString(v, 'payoutRecipient', 'payout_recipient') || undefined,
      externalAddress: readString(v, 'externalAddress', 'external_address') || undefined,
      rpcUrl: readString(v, 'rpcUrl', 'rpc_url') || undefined,
    });
  }

  throw new Error(`Unsupported message type: ${typeUrl}`);
}
