import { Schema, model, Types } from 'mongoose';

export interface BankAccountInfo {
  accountId: string;
  maskedPan: string;
  currencyCode: number;
  balance: number;
  type: string;
}

export interface BankConnectionDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  provider: 'monobank';
  encryptedToken: string;
  accounts: BankAccountInfo[];
  lastSyncedAt?: Date;
  lastSyncAttemptAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bankConnectionSchema = new Schema<BankConnectionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    provider: { type: String, enum: ['monobank'], required: true, default: 'monobank' },
    encryptedToken: { type: String, required: true },
    accounts: [
      {
        accountId: String,
        maskedPan: String,
        currencyCode: Number,
        balance: Number,
        type: String,
      },
    ],
    lastSyncedAt: { type: Date },
    lastSyncAttemptAt: { type: Date },
  },
  { timestamps: true }
);

export const BankConnection = model<BankConnectionDoc>('BankConnection', bankConnectionSchema);
