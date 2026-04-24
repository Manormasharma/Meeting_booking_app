// seedAdminUser.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const username = 'admin';
    const password = 'admin123';
    const role = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);
    const exists = await User.findOne({ username });
    if (!exists) {
      await User.create({ username, password: hashedPassword, role });
      console.log('Admin user created: admin / admin123');
    } else {
      console.log('Admin user already exists');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedAdmin();
