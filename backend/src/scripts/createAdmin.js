import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import { connectDB } from '../config/db.js';

const [email, password, name = 'Admin'] = process.argv.slice(2);

if (!email || !password) {
  console.log('Usage: npm run create-admin -- <email> <password> [name]');
  console.log('Example: npm run create-admin -- reception@company.com SecurePass123 "Reception"');
  process.exit(1);
}

const run = async () => {
  await connectDB();

  const exists = await Admin.findOne({ email: email.toLowerCase() });
  if (exists) {
    console.error(`Admin already exists: ${email}`);
    process.exit(1);
  }

  await Admin.create({ email, password, name });
  console.log(`Admin created: ${email} (${name})`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
