import { Schema, model, Types } from 'mongoose';

export interface TransactionDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  provider: 'monobank';
  accountId: string;
  externalId: string;
  amount: number;
  operationAmount: number;
  currencyCode: number;
  mcc: number;
  description: string;
  time: Date;
  balanceAfter: number;
  categoryOverride?: string;
  createdAt: Date;
}

const transactionSchema = new Schema<TransactionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['monobank'], required: true, default: 'monobank' },
    accountId: { type: String, required: true },
    externalId: { type: String, required: true },
    amount: { type: Number, required: true },
    operationAmount: { type: Number, required: true },
    currencyCode: { type: Number, required: true },
    mcc: { type: Number, required: true },
    description: { type: String, required: true },
    time: { type: Date, required: true },
    balanceAfter: { type: Number, required: true },
    categoryOverride: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

transactionSchema.index({ userId: 1, externalId: 1 }, { unique: true });
transactionSchema.index({ userId: 1, accountId: 1, time: -1 });

export const Transaction = model<TransactionDoc>('Transaction', transactionSchema);
