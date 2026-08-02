export type UserRole = 'admin' | 'user';

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  workspaceId: string;
  avatarUrl?: string;
}

export interface AdminUserRow {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isOnline: boolean;
  lastActivityAt?: string;
  createdAt: string;
}

export interface Column {
  _id: string;
  title: string;
  order: number;
  isTerminal: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  columnId: string;
  order: number;
  assigneeId?: string;
  createdBy: string;
  deadlineDate?: string;
  deadlineTime?: string;
  imageUrl?: string;
  tag?: string;
  tagColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPayload {
  taskId: string;
  taskTitle: string;
  fromUserId?: string;
  fromUsername?: string;
  deadlineDate?: string;
  deadlineTime?: string;
}

export interface AppNotification {
  _id?: string;
  id?: string;
  type: 'task_assigned' | 'task_completed';
  payload: NotificationPayload;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogRow {
  _id: string;
  userId: string;
  username: string;
  action: string;
  targetType: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface ShoppingListItem {
  _id: string;
  title: string;
  quantity?: string;
  isPurchased: boolean;
}

export interface ShoppingList {
  _id: string;
  title: string;
  color: string;
  items: ShoppingListItem[];
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  accountId: string;
  maskedPan: string;
  currencyCode: number;
  balance: number;
  type: string;
}

export interface FinanceTransaction {
  id: string;
  accountId: string;
  amount: number;
  currencyCode: number;
  mcc: number;
  description: string;
  time: string;
  balanceAfter: number;
  category: string;
  categoryOverride?: string;
}

export interface FinanceStats {
  summary: {
    totalSpent: number;
    totalIncome: number;
    transactionCount: number;
    avgTransaction: number;
  };
  totalsByCategory: Array<{ category: string; amount: number }>;
  top5Categories: Array<{ category: string; amount: number }>;
  trend: Array<{ date: string; spent: number; income: number }>;
  monthComparison: Array<{ month: string; spent: number; income: number }>;
}
