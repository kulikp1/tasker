import { Schema, model, Types } from 'mongoose';

export interface WorkspaceDoc {
  _id: Types.ObjectId;
  name: string;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<WorkspaceDoc>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Workspace = model<WorkspaceDoc>('Workspace', workspaceSchema);
