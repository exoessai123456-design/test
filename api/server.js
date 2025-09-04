require('dotenv').config();
const express = require('express');
const { connectDB, Event, Job } = require('../db');
const authRoutes = require('../routes/auth');
const cors = require('cors');
const middlewaree = require('../middleware/middleware'); 
const { scheduleEventReminder } = require('../utils/reminderScheduler');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'YOUR_FRONTEND_URL', methods: ['GET','POST','PUT','DELETE'], credentials: true }));

app.get('/health', (req, res) => res.send('ok'));
app.use('/api/admin', authRoutes);
app.use('/api/events', middlewaree);
app.use('/api/jobs', middlewaree);

// Example route
app.get('/api/events', async (req, res) => {
  await connectDB();
  const events = await Event.find({ createdBy: req.admin.email, status: { $ne: 'DELETED' } });
  res.json(events);
});

// other routes... same as before

module.exports = serverless(app); // replace app.listen()
