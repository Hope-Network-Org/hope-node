/**
 * Drop this into the host page that sets node payout.
 *
 *   npm install @hopenetwork/wallet react
 *
 * Your HTTPS origin must also serve the session routes in ./sessions.ts
 * (POST/GET/DELETE /api/hope-wallet/sessions, POST …/confirm).
 *
 * Do not collect mnemonics here.
 */
import { useCallback, useMemo, useState } from 'react';
import { createHttpTransport, type WalletProof } from '@hopenetwork/wallet';
import { MessagePanel, VerifyWalletPanel } from '@hopenetwork/wallet/react';

const CHAIN_ID = 'hope-testnet-2';

export type PayoutWalletProps = {
  /** Shown in Hope Wallet as the requesting app. */
  appName?: string;
  /**
   * Hot-key address that lives on this node (`hope1…`).
   * From the operator mnemonic — never the customer’s phrase.
   */
  operatorAddress: string;
  /** Optional on-chain authorize label (shown in explorer). */
  authorizeLabel?: string;
  chainId?: string;
  /** Persist PAYOUT and kick operator update-node + optional sweep. */
  onPayoutReady: (payout: string) => void | Promise<void>;
  onError?: (message: string) => void;
};

export function PayoutWallet({
  appName = 'Hosted node',
  operatorAddress,
  authorizeLabel = 'hosted',
  chainId = CHAIN_ID,
  onPayoutReady,
  onError,
}: PayoutWalletProps) {
  const origin = useMemo(
    () => ({ name: appName, url: window.location.origin }),
    [appName]
  );
  const transport = useMemo(
    () =>
      createHttpTransport({
        baseUrl: `${window.location.origin}/api/hope-wallet`,
      }),
    []
  );

  const [proof, setProof] = useState<WalletProof | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const reportError = useCallback(
    (message: string) => {
      onError?.(message);
    },
    [onError]
  );

  const payout = proof?.address ?? '';
  const sameAsOperator =
    payout.length > 0 && payout.toLowerCase() === operatorAddress.toLowerCase();

  const finish = useCallback(
    async (address: string) => {
      setBusy(true);
      try {
        await onPayoutReady(address);
        setDone(true);
      } catch (e) {
        reportError(e instanceof Error ? e.message : 'Could not save payout');
      } finally {
        setBusy(false);
      }
    },
    [onPayoutReady, reportError]
  );

  if (done && payout) {
    return (
      <p style={{ color: '#166534', fontWeight: 600 }}>
        Payout set to {payout}. Future rewards go to this Hope Wallet.
      </p>
    );
  }

  if (!proof) {
    return (
      <VerifyWalletPanel
        origin={origin}
        chainId={chainId}
        transport={transport}
        relayUrl={true}
        title="Connect Hope Wallet"
        description="Scan with Hope Wallet (or approve in the app). This is the address that will receive node rewards."
        onVerified={setProof}
        onError={reportError}
      />
    );
  }

  if (sameAsOperator) {
    return (
      <div>
        <p>
          Connected {payout}. Same as this node’s operator — no extra authorize
          tx.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void finish(payout)}
        >
          {busy ? 'Saving…' : 'Use this address'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontFamily: 'monospace', fontSize: 13 }}>{payout}</p>
      <MessagePanel
        origin={origin}
        chainId={chainId}
        account={payout}
        title="Authorize this node"
        preview={{
          title: 'Authorize node',
          summary: 'Allow this hosted node to send rewards to this Hope Wallet',
        }}
        messages={[
          {
            typeUrl: '/hope.incentives.v1.MsgAuthorizeOperator',
            value: {
              payoutRecipient: payout,
              operator: operatorAddress,
              label: authorizeLabel,
            },
          },
        ]}
        onComplete={() => {
          void finish(payout);
        }}
        onError={reportError}
      />
    </div>
  );
}

export default PayoutWallet;
