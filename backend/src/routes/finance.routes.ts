import { Router } from 'express';
import { z } from 'zod';
import { BankConnection } from '../models/BankConnection';
import { Transaction } from '../models/Transaction';
import { requireAuth, requireRole } from '../middleware/auth';
import { encryptSecret, decryptSecret } from '../services/crypto.service';
import {
  fetchClientInfo,
  fetchStatement,
  MONOBANK_MIN_SYNC_INTERVAL_MS,
  MONOBANK_MAX_RANGE_DAYS,
} from '../services/monobank.service';
import { categoryForMcc } from '../services/mcc';
import { writeAuditLog } from '../services/auditLog.service';

export const financeRouter = Router();

financeRouter.use(requireAuth, requireRole('admin'));

function toMajorUnits(minorAmount: number): number {
  return Math.round(minorAmount) / 100;
}

function serializeTransaction(tx: InstanceType<typeof Transaction>) {
  const category = tx.categoryOverride ?? categoryForMcc(tx.mcc);
  return {
    id: tx._id.toString(),
    accountId: tx.accountId,
    amount: toMajorUnits(tx.amount),
    currencyCode: tx.currencyCode,
    mcc: tx.mcc,
    description: tx.description,
    time: tx.time,
    balanceAfter: toMajorUnits(tx.balanceAfter),
    category,
    categoryOverride: tx.categoryOverride,
  };
}

const connectSchema = z.object({ token: z.string().min(10) });

financeRouter.post('/monobank/connect', async (req, res, next) => {
  try {
    const { token } = connectSchema.parse(req.body);
    const clientInfo = await fetchClientInfo(token);
    const encryptedToken = encryptSecret(token);
    const accounts = clientInfo.accounts.map((acc) => ({
      accountId: acc.id,
      maskedPan: acc.maskedPan[0] ?? '****',
      currencyCode: acc.currencyCode,
      balance: acc.balance,
      type: acc.type,
    }));
    await BankConnection.findOneAndUpdate(
      { userId: req.user!.sub },
      { userId: req.user!.sub, provider: 'monobank', encryptedToken, accounts },
      { upsert: true, new: true }
    );
    await writeAuditLog({ workspaceId: req.user!.workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'connect_bank', targetType: 'bankConnection', meta: { provider: 'monobank', accounts: accounts.length } });
    res.json({ accounts: accounts.map((a) => ({ ...a, balance: toMajorUnits(a.balance) })) });
  } catch (err) {
    if (err instanceof Error && err.message.includes('401')) {
      res.status(400).json({ error: 'Невірний Monobank токен' });
      return;
    }
    next(err);
  }
});

financeRouter.get('/monobank/accounts', async (req, res, next) => {
  try {
    const connection = await BankConnection.findOne({ userId: req.user!.sub });
    if (!connection) {
      res.json({ accounts: [], lastSyncedAt: null });
      return;
    }
    res.json({
      accounts: connection.accounts.map((a) => ({ ...a, balance: toMajorUnits(a.balance) })),
      lastSyncedAt: connection.lastSyncedAt,
    });
  } catch (err) {
    next(err);
  }
});

financeRouter.post('/monobank/sync', async (req, res, next) => {
  try {
    const connection = await BankConnection.findOne({ userId: req.user!.sub });
    if (!connection) {
      res.status(400).json({ error: 'Спочатку підключіть Monobank у налаштуваннях' });
      return;
    }
    const now = Date.now();
    if (connection.lastSyncAttemptAt && now - connection.lastSyncAttemptAt.getTime() < MONOBANK_MIN_SYNC_INTERVAL_MS) {
      const waitSec = Math.ceil((MONOBANK_MIN_SYNC_INTERVAL_MS - (now - connection.lastSyncAttemptAt.getTime())) / 1000);
      res.status(429).json({ error: `Monobank дозволяє синхронізацію не частіше ніж 1 раз на хвилину. Спробуйте через ${waitSec}с.` });
      return;
    }
    connection.lastSyncAttemptAt = new Date(now);
    await connection.save();

    const token = decryptSecret(connection.encryptedToken);
    const toSeconds = Math.floor(now / 1000);
    const sinceLastSync = connection.lastSyncedAt ? Math.floor(connection.lastSyncedAt.getTime() / 1000) : toSeconds - MONOBANK_MAX_RANGE_DAYS * 24 * 60 * 60;
    const fromSeconds = Math.max(sinceLastSync, toSeconds - MONOBANK_MAX_RANGE_DAYS * 24 * 60 * 60);

    let totalSynced = 0;
    for (const account of connection.accounts) {
      const statement = await fetchStatement(token, account.accountId, fromSeconds, toSeconds);
      if (statement.length === 0) continue;
      const ops = statement.map((item) => ({
        updateOne: {
          filter: { userId: req.user!.sub, externalId: item.id },
          update: {
            $set: {
              userId: req.user!.sub,
              provider: 'monobank',
              accountId: account.accountId,
              externalId: item.id,
              amount: item.amount,
              operationAmount: item.operationAmount,
              currencyCode: item.currencyCode,
              mcc: item.mcc,
              description: item.description,
              time: new Date(item.time * 1000),
              balanceAfter: item.balance,
            },
          },
          upsert: true,
        },
      }));
      await Transaction.bulkWrite(ops as Parameters<typeof Transaction.bulkWrite>[0]);
      totalSynced += statement.length;
    }

    connection.lastSyncedAt = new Date(now);
    await connection.save();
    await writeAuditLog({ workspaceId: req.user!.workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'sync_bank', targetType: 'bankConnection', meta: { totalSynced } });
    res.json({ ok: true, synced: totalSynced });
  } catch (err) {
    next(err);
  }
});

financeRouter.get('/transactions', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Number(req.query.limit ?? 20));
    const accountId = typeof req.query.accountId === 'string' ? req.query.accountId : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined;

    const filter: Record<string, unknown> = { userId: req.user!.sub };
    if (accountId) filter.accountId = accountId;
    if (from || to) {
      filter.time = {};
      if (from) (filter.time as any).$gte = from;
      if (to) (filter.time as any).$lte = to;
    }

    let items = await Transaction.find(filter).sort({ time: -1 }).limit(2000);
    let serialized = items.map(serializeTransaction);
    if (category) {
      serialized = serialized.filter((t) => t.category === category);
    }
    const total = serialized.length;
    const paged = serialized.slice((page - 1) * limit, page * limit);
    res.json({ transactions: paged, total, page, limit });
  } catch (err) {
    next(err);
  }
});

const categorySchema = z.object({ category: z.string().min(1).max(60) });

financeRouter.patch('/transactions/:id/category', async (req, res, next) => {
  try {
    const { category } = categorySchema.parse(req.body);
    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.sub },
      { categoryOverride: category },
      { new: true }
    );
    if (!tx) {
      res.status(404).json({ error: 'Транзакцію не знайдено' });
      return;
    }
    res.json({ transaction: serializeTransaction(tx) });
  } catch (err) {
    next(err);
  }
});

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

financeRouter.get('/stats', async (req, res, next) => {
  try {
    const accountId = typeof req.query.accountId === 'string' ? req.query.accountId : undefined;
    const days = Math.min(365, Number(req.query.days ?? 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const filter: Record<string, unknown> = { userId: req.user!.sub, time: { $gte: since } };
    if (accountId) filter.accountId = accountId;

    const transactions = await Transaction.find(filter).sort({ time: 1 });
    const serialized = transactions.map(serializeTransaction);

    let totalSpent = 0;
    let totalIncome = 0;
    const byCategory = new Map<string, number>();
    const byDay = new Map<string, { spent: number; income: number }>();

    for (const tx of serialized) {
      if (tx.amount < 0) {
        totalSpent += -tx.amount;
        byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + -tx.amount);
      } else {
        totalIncome += tx.amount;
      }
      const key = dayKey(new Date(tx.time));
      const bucket = byDay.get(key) ?? { spent: 0, income: 0 };
      if (tx.amount < 0) bucket.spent += -tx.amount;
      else bucket.income += tx.amount;
      byDay.set(key, bucket);
    }

    const totalsByCategory = Array.from(byCategory.entries())
      .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount);

    const trend = Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({ date, spent: Math.round(v.spent * 100) / 100, income: Math.round(v.income * 100) / 100 }));

    const monthFilter: Record<string, unknown> = { userId: req.user!.sub, time: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } };
    if (accountId) monthFilter.accountId = accountId;
    const monthTx = (await Transaction.find(monthFilter)).map(serializeTransaction);
    const byMonth = new Map<string, { spent: number; income: number }>();
    for (const tx of monthTx) {
      const key = monthKey(new Date(tx.time));
      const bucket = byMonth.get(key) ?? { spent: 0, income: 0 };
      if (tx.amount < 0) bucket.spent += -tx.amount;
      else bucket.income += tx.amount;
      byMonth.set(key, bucket);
    }
    const monthComparison = Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, v]) => ({ month, spent: Math.round(v.spent * 100) / 100, income: Math.round(v.income * 100) / 100 }));

    res.json({
      summary: {
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalIncome: Math.round(totalIncome * 100) / 100,
        transactionCount: serialized.length,
        avgTransaction: serialized.length ? Math.round((totalSpent / serialized.length) * 100) / 100 : 0,
      },
      totalsByCategory,
      top5Categories: totalsByCategory.slice(0, 5),
      trend,
      monthComparison,
    });
  } catch (err) {
    next(err);
  }
});
