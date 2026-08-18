/** Hope Wallet uses 24-word BIP-39 phrases. Never log the return value. */
export function assertHopeMnemonic(mnemonic: string): string {
  const words = mnemonic.trim().split(/\s+/).filter(Boolean);
  if (words.length !== 24) {
    throw new Error('Hope mnemonic must be 24 BIP-39 words');
  }
  return words.join(' ');
}
