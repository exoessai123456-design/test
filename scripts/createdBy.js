// script.js
require('dotenv').config();
const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  name: String,
  phone: String,
  type: String,
});
const Event = mongoose.model('Event', eventSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Populate the admin details instead of just ID
    const events = await Event.find().populate('createdBy', 'email').lean();

    console.log('Events with admin info:');
    events.forEach((e) => {
      console.log(`- ${e.date} | ${e.name} | created by: ${e.createdBy?.email || 'N/A'}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error running script:', err);
    process.exit(1);
  }
}

run();
