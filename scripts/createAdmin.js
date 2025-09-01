require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/admin');

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const email = 'admin2@gmail.com';
  const password = 'admin123';

  try {
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log('Admin already exists');
    } else {
      await Admin.create({ email, password });
      console.log('Admin created');
    }
  } catch (err) {
    console.error('Error creating admin:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

run();
