// db.js (serverless-ready)
const mongoose = require('mongoose');

let isConnected = false; // cache connection across serverless invocations

const connectDB = async () => {
  if (isConnected) return; // reuse cached connection

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Throw instead of exiting process
    throw error;
  }
};

// Event schema
const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  name: String,
  phone: String,
  type: String,
  status: {
    type: String,
    enum: ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'DELETED'],
    default: 'CONFIRMED',
  },
  createdBy: {
    type: String,
    required: true,
  },
});

// Job schema
const jobSchema = new mongoose.Schema({
  eventId: String,
  createdOn: String,
  updatedOn: {
    type: String,
    default: null,
  },
  sentTo: String,
  status: {
    type: String,
    enum: ['PREPARED', 'SENT', 'FAILED'],
    default: 'PREPARED',
  },
  motifFailure: {
    type: String,
    default: null,
  },
});

// Avoid model overwrite errors in serverless
const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

module.exports = { connectDB, Event, Job };
