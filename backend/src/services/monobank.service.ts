const BASE_URL = 'https://api.monobank.ua';

export interface MonobankAccount {
  id: string;
  balance: number;
  currencyCode: number;
  maskedPan: string[];
  type: string;
}

export interface MonobankClientInfo {
  clientId: string;
  name: string;
  accounts: MonobankAccount[];
}

export interface MonobankStatementItem {
  id: string;
  time: number;
  description: string;
  mcc: number;
  amount: number;
  operationAmount: number;
  currencyCode: number;
  balance: number;
}

class MonobankApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function fetchClientInfo(token: string): Promise<MonobankClientInfo> {
  const res = await fetch(`${BASE_URL}/personal/client-info`, {
    headers: { 'X-Token': token },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new MonobankApiError(res.status, `Monobank client-info failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<MonobankClientInfo>;
}

export async function fetchStatement(
  token: string,
  accountId: string,
  fromSeconds: number,
  toSeconds: number
): Promise<MonobankStatementItem[]> {
  const res = await fetch(
    `${BASE_URL}/personal/statement/${accountId}/${fromSeconds}/${toSeconds}`,
    { headers: { 'X-Token': token } }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new MonobankApiError(res.status, `Monobank statement failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<MonobankStatementItem[]>;
}

export const MONOBANK_MIN_SYNC_INTERVAL_MS = 60_000;
export const MONOBANK_MAX_RANGE_DAYS = 31;
