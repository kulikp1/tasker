import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';

interface LogParams {
  workspaceId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  username: string;
  action: string;
  targetType: string;
  targetId?: Types.ObjectId | string;
  meta?: Record<string, unknown>;
}

export async function writeAuditLog(params: LogParams): Promise<void> {
  try {
    await AuditLog.create(params);
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}
