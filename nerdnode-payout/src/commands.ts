import type { HostFollowUpCommands } from './types';
import { DEFAULT_CHAIN_ID, DEFAULT_RPC } from './types';

/**
 * Host-side CLI snippets NerdNode can run on the peer after authorization succeeds.
 * Operator key signs these (inside the peer container).
 */
export function buildHostFollowUpCommands(params: {
  payoutAddress: string;
  containerName?: string;
  chainId?: string;
  rpc?: string;
  label?: string;
}): HostFollowUpCommands {
  const container = params.containerName ?? 'hope-peer';
  const chainId = params.chainId ?? DEFAULT_CHAIN_ID;
  const rpc = params.rpc ?? 'tcp://127.0.0.1:26657';
  const payout = params.payoutAddress.trim();
  const labelArg = JSON.stringify(params.label ?? '');

  const common = [
    `--from operator`,
    `--home /home/hope/.hope`,
    `--keyring-backend test`,
    `--chain-id ${chainId}`,
    `--node ${rpc}`,
    `--sign-mode pq-direct`,
    `--gas auto`,
    `--gas-adjustment 1.5`,
    `--gas-prices 0.0001uhope`,
    `-y`,
  ].join(' ');

  const updateNode = [
    `docker exec ${container} hoped tx incentives update-node ${labelArg}`,
    `--payout-recipient ${payout}`,
    common,
  ].join(' ');

  const bankSendAll = [
    `# Send ALL spendable uhope from operator → payout (leaves dust for fees if needed)`,
    `BAL=$(docker exec ${container} hoped query bank balances $(docker exec ${container} hoped keys show operator -a --home /home/hope/.hope --keyring-backend test) --denom uhope --home /home/hope/.hope -o json | jq -r '.balance.amount // "0"')`,
    `SEND=$(( BAL > 10000 ? BAL - 10000 : 0 ))`,
    `docker exec ${container} hoped tx bank send operator ${payout} \${SEND}uhope ${common}`,
  ].join('\n');

  return {
    updateNode,
    bankSendAll,
    bankSendAmount: (amountUhope: string) =>
      [
        `docker exec ${container} hoped tx bank send operator ${payout} ${amountUhope}uhope`,
        common,
      ].join(' '),
    setEnvHint: `PAYOUT_RECIPIENT=${payout}  # update .env so future re-registers keep this payout`,
  };
}

/** Gateway RPC hint for cold-wallet authorize when not using Hope Wallet QR. */
export function authorizeOperatorCli(params: {
  operatorAddress: string;
  payoutKeyName: string;
  label?: string;
  chainId?: string;
  rpc?: string;
}): string {
  const chainId = params.chainId ?? DEFAULT_CHAIN_ID;
  const rpc = params.rpc ?? DEFAULT_RPC;
  const label = params.label ?? 'nerdnode';
  return [
    `hoped tx incentives authorize-operator ${params.operatorAddress} ${JSON.stringify(label)}`,
    `--from ${params.payoutKeyName}`,
    `--chain-id ${chainId}`,
    `--node ${rpc}`,
    `--sign-mode pq-direct`,
    `-y`,
  ].join(' ');
}
