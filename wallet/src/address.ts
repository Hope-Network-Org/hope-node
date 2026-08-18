/** BIP-173 charset (lowercase). */
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]): number {
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= GEN[i]!;
    }
  }
  return chk;
}

function hrpExpand(hrp: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
  out.push(0);
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) & 31);
  return out;
}

function bech32Verify(addr: string): { hrp: string } | null {
  const lower = addr.toLowerCase();
  if (lower !== addr && addr.toUpperCase() !== addr) return null;
  const s = lower;
  const pos = s.lastIndexOf('1');
  if (pos < 1 || pos + 7 > s.length || s.length > 90) return null;
  const hrp = s.slice(0, pos);
  const data = s.slice(pos + 1);
  const values: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const idx = BECH32_CHARSET.indexOf(data[i]!);
    if (idx === -1) return null;
    values.push(idx);
  }
  if (polymod(hrpExpand(hrp).concat(values)) !== 1) return null;
  return { hrp };
}

function convertBits(
  data: number[],
  fromBits: number,
  toBits: number,
  pad: boolean
): number[] | null {
  let acc = 0;
  let bits = 0;
  const maxv = (1 << toBits) - 1;
  const out: number[] = [];
  for (const value of data) {
    if (value < 0 || value >> fromBits) return null;
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      out.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) out.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
  }
  return out;
}

function createChecksum(hrp: string, data: number[]): number[] {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = polymod(values) ^ 1;
  const ret: number[] = [];
  for (let p = 0; p < 6; p++) ret.push((mod >> (5 * (5 - p))) & 31);
  return ret;
}

/** Encode 20-byte account hash as `hope1…`. */
export function encodeHopeAccountAddress(hash20: Uint8Array): string {
  if (hash20.length !== 20) throw new Error('account hash must be 20 bytes');
  const words = convertBits([...hash20], 8, 5, true);
  if (!words) throw new Error('bech32 convert failed');
  const combined = words.concat(createChecksum('hope', words));
  let out = 'hope1';
  for (const w of combined) out += BECH32_CHARSET[w];
  return out;
}

/** True when `value` is a checksummed Hope account address (`hope1…`). */
export function isHopeAccountAddress(value: string): boolean {
  const addr = value.trim();
  if (!addr.startsWith('hope1') && !addr.startsWith('HOPE1')) return false;
  const decoded = bech32Verify(addr);
  return decoded?.hrp === 'hope';
}

export function assertHopeAccountAddress(value: string, label = 'address'): string {
  const addr = value.trim();
  if (!isHopeAccountAddress(addr)) {
    throw new Error(`${label} must be a valid hope1… Bech32 address`);
  }
  return addr;
}
