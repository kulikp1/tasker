import { Schema, model, Types } from 'mongoose';

export interface ShoppingListItemDoc {
  _id: Types.ObjectId;
  title: string;
  quantity?: string;
  isPurchased: boolean;
}

export interface ShoppingListDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  title: string;
  color: string;
  items: Types.DocumentArray<ShoppingListItemDoc>;
  createdBy: Types.ObjectId;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shoppingListItemSchema = new Schema<ShoppingListItemDoc>(
  {
    title: { type: String, required: true, trim: true },
    quantity: { type: String, trim: true },
    isPurchased: { type: Boolean, default: false },
  },
  { _id: true }
);

const shoppingListSchema = new Schema<ShoppingListDoc>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    title: { type: String, required: true, trim: true },
    color: { type: String, default: 'cream' },
    items: { type: [shoppingListItemSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

shoppingListSchema.index({ isArchived: 1, createdAt: -1 });

export const ShoppingList = model<ShoppingListDoc>('ShoppingList', shoppingListSchema);
