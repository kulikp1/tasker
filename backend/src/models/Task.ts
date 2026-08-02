import { Schema, model, Types } from 'mongoose';

export interface TaskDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  title: string;
  description?: string;
  columnId: Types.ObjectId;
  order: number;
  assigneeId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  deadlineDate?: string;
  deadlineTime?: string;
  imageUrl?: string;
  tag?: string;
  tagColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDoc>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    columnId: { type: Schema.Types.ObjectId, ref: 'Column', required: true },
    order: { type: Number, required: true, default: 0 },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deadlineDate: { type: String },
    deadlineTime: { type: String },
    imageUrl: { type: String },
    tag: { type: String, trim: true },
    tagColor: { type: String },
  },
  { timestamps: true }
);

taskSchema.index({ workspaceId: 1, columnId: 1, order: 1 });

export const Task = model<TaskDoc>('Task', taskSchema);
