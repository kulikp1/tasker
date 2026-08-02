import { Schema, model, Types } from 'mongoose';

export type UserRole = 'admin' | 'user';

export interface UserDoc {
  _id: Types.ObjectId;
  username: string;
  email: string;
  googleId?: string;
  role: UserRole;
  workspaceId: Types.ObjectId;
  avatarUrl?: string;
  isOnline: boolean;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['admin', 'user'], required: true, default: 'user' },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    avatarUrl: { type: String },
    isOnline: { type: Boolean, default: false },
    lastActivityAt: { type: Date },
  },
  { timestamps: true }
);

export const User = model<UserDoc>('User', userSchema);
