import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Settings from '../models/Settings.js';
import { connectDB } from '../config/db.js';

const seed = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@company.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await Admin.findOne({ email });
  if (!existing) {
    await Admin.create({ email, password, name: 'Admin' });
    console.log(`Admin created: ${email}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  const settings = await Settings.findOne();
  if (!settings) {
    await Settings.create({});
    console.log('Default settings created');
  }

  await mongoose.disconnect();
  console.log('Seed completed');
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
