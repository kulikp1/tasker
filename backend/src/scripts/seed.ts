import { connectDb } from '../db/connect';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Column } from '../models/Column';
import { env } from '../config/env';
import mongoose from 'mongoose';

async function seedAdmin(): Promise<void> {
  if (!env.adminSeedEmail) {
    console.log('— ADMIN_SEED_EMAIL не задано, пропускаю створення адміна.');
    return;
  }
  const email = env.adminSeedEmail.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`— Юзер з поштою "${email}" вже існує, пропускаю.`);
    return;
  }
  const username = email.split('@')[0];
  const workspace = await Workspace.create({ name: `Середовище ${username}`, ownerId: new mongoose.Types.ObjectId() });
  const admin = await User.create({ username, email, role: 'admin', workspaceId: workspace._id });
  workspace.ownerId = admin._id;
  await workspace.save();
  await seedColumns(workspace._id);
  console.log(`— Створено адміна, запрошеного на пошту "${email}", і його середовище. Увійти можна через "Увійти через Google" цією поштою.`);
}

async function seedColumns(workspaceId: mongoose.Types.ObjectId): Promise<void> {
  await Column.insertMany([
    { workspaceId, title: 'Треба зробити', order: 0, isTerminal: false },
    { workspaceId, title: 'В процесі', order: 1, isTerminal: false },
    { workspaceId, title: 'Готово', order: 2, isTerminal: true },
  ]);
  console.log('— Створено стандартні колонки дошки (Треба зробити / В процесі / Готово).');
}

async function main() {
  await connectDb();
  console.log('Підключено до MongoDB, сідую дані...\n');

  await seedAdmin();

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
