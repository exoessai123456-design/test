const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  name: String,
  phone: String,
  type: String,
   status: {
    type: String,
    enum: ['CONFIRMED', 'COMPLETED', 'CANCELLED','DELETED'],
    default: 'CONFIRMED'
  },
  createdBy: {
    type: String,
    required: true
  }
});


const jobSchema = new mongoose.Schema({
  eventId: String,
  createdOn: String,
  updatedOn: {
    type: String,
    default : null
  },
  sentTo: String,
  status: {
    type: String,
    enum: ['PREPARED', 'SENT', 'FAILED'],
    default: 'PREPARED'
  },
  motifFailure:{
    type: String,
    default : null
  }
});

const Event = mongoose.model('Event', eventSchema);
const Job = mongoose.model('Job', jobSchema);

module.exports = { connectDB, Event , Job };
