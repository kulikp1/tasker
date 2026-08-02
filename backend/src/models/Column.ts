import { Schema, model, Types } from 'mongoose';

export interface ColumnDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  title: string;
  order: number;
  isTerminal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const columnSchema = new Schema<ColumnDoc>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    isTerminal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

columnSchema.index({ workspaceId: 1, order: 1 });

export const Column = model<ColumnDoc>('Column', columnSchema);
