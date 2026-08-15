import { DEFAULT_LCD_BASE, type OperatorAuthorization } from './types';

export function operatorAuthorizationsUrl(
  payoutAddress: string,
  lcdBase: string = DEFAULT_LCD_BASE
): string {
  const base = lcdBase.replace(/\/$/, '');
  return `${base}/hope/incentives/v1/operator_authorizations/${encodeURIComponent(payoutAddress)}`;
}

export async function fetchOperatorAuthorizations(
  payoutAddress: string,
  lcdBase: string = DEFAULT_LCD_BASE
): Promise<OperatorAuthorization[]> {
  const res = await fetch(operatorAuthorizationsUrl(payoutAddress, lcdBase));
  if (!res.ok) {
    throw new Error(`Authorization query failed (${res.status})`);
  }
  const json = (await res.json()) as {
    authorizations?: OperatorAuthorization[];
    Authorization?: OperatorAuthorization[];
  };
  return json.authorizations ?? json.Authorization ?? [];
}

export function isOperatorAuthorized(
  authorizations: OperatorAuthorization[],
  operatorAddress: string
): boolean {
  const target = operatorAddress.trim().toLowerCase();
  return authorizations.some((a) => a.operator?.trim().toLowerCase() === target);
}

export async function waitForOperatorAuthorization(params: {
  payoutAddress: string;
  operatorAddress: string;
  lcdBase?: string;
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<OperatorAuthorization> {
  const intervalMs = params.intervalMs ?? 2000;
  const timeoutMs = params.timeoutMs ?? 5 * 60 * 1000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (params.signal?.aborted) {
      throw new Error('Authorization wait aborted');
    }
    const list = await fetchOperatorAuthorizations(
      params.payoutAddress,
      params.lcdBase
    );
    const match = list.find(
      (a) =>
        a.operator?.trim().toLowerCase() ===
        params.operatorAddress.trim().toLowerCase()
    );
    if (match) return match;

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('Timed out waiting for authorize-operator on chain');
}
