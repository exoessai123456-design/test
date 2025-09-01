const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/mvp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  name: String,
  phone: String,
  type: String,
});

const Event = mongoose.model('Event', eventSchema);

async function run() {
  const newEvent = new Event({
    title: 'Test Event',
    date: '2025-07-10',
    name: 'John Doe',
    phone: '0612345678',
    type: 'Point',
  });

  await newEvent.save();
  console.log('Event saved');
  mongoose.disconnect();
}

run().catch(console.error);
