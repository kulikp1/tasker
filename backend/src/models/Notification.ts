import { Schema, model, Types } from 'mongoose';

export type NotificationType = 'task_assigned' | 'task_completed';

export interface NotificationDoc {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  type: NotificationType;
  payload: {
    taskId: Types.ObjectId;
    taskTitle: string;
    fromUserId?: Types.ObjectId;
    fromUsername?: string;
    deadlineDate?: string;
    deadlineTime?: string;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['task_assigned', 'task_completed'], required: true },
    payload: {
      taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
      taskTitle: { type: String, required: true },
      fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
      fromUsername: { type: String },
      deadlineDate: { type: String },
      deadlineTime: { type: String },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });

export const Notification = model<NotificationDoc>('Notification', notificationSchema);
