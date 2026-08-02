import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { CHANNELS, EVENTS, triggerSafe } from './pusher.service';

interface CreateNotificationParams {
  recipientId: Types.ObjectId | string;
  type: NotificationType;
  payload: {
    taskId: Types.ObjectId | string;
    taskTitle: string;
    fromUserId?: Types.ObjectId | string;
    fromUsername?: string;
    deadlineDate?: string;
    deadlineTime?: string;
  };
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const notification = await Notification.create({
    recipientId: params.recipientId,
    type: params.type,
    payload: params.payload,
  });
  triggerSafe(CHANNELS.notifications(String(params.recipientId)), EVENTS.notificationCreated, {
    id: notification._id.toString(),
    type: notification.type,
    payload: notification.payload,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  });
}
