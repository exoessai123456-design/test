const express = require('express');
const cors = require('cors');
const { connectDB, Event, Job } = require('../db');
const authMiddleware = require('../middleware/middleware');
const { scheduleEventReminder } = require('../utils/reminderScheduler');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'https://mvp-frontend-fgmsykyc5-exoessai123456-designs-projects.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Lazy DB connection for serverless
const ensureDB = async () => {
  if (!connectDB._connected) {
    await connectDB();
    connectDB._connected = true;
  }
};

// Health check
app.get('/api/health', async (req, res) => {
  await ensureDB();
  res.send('ok');
});

// Auth routes
app.use('/api/admin', async (req, res, next) => {
  await ensureDB();
  authMiddleware(req, res, next);
});

// Event routes
app.use('/api/events', async (req, res, next) => {
  await ensureDB();
  authMiddleware(req, res, next);
  next();
});

// Job routes
app.use('/api/jobs', async (req, res, next) => {
  await ensureDB();
  authMiddleware(req, res, next);
  next();
});

// GET all events by admin (not deleted)
app.get('/api/events', authMiddleware, async (req, res) => {
  await ensureDB();
  try {
    const events = await Event.find({
      createdBy: req.admin.email,
      status: { $ne: 'DELETED' },
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// POST create event
app.post('/api/events', authMiddleware, async (req, res) => {
  await ensureDB();
  try {
    const newEvent = new Event({
      ...req.body,
      createdBy: req.admin.email,
    });
    const savedEvent = await newEvent.save();
    scheduleEventReminder(savedEvent);
    res.status(201).json(savedEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating event' });
  }
});

// PUT update event
app.put('/api/events/:id', authMiddleware, async (req, res) => {
  await ensureDB();
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.admin.email },
      req.body,
      { new: true }
    );
    scheduleEventReminder(event);
    if (!event) return res.status(404).json({ message: 'Event not found or unauthorized' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating event' });
  }
});

// DELETE (soft delete) event
app.delete('/api/events/:id', authMiddleware, async (req, res) => {
  await ensureDB();
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.admin.email },
      { status: 'DELETED' }
    );
    scheduleEventReminder(event);
    if (!event) return res.status(404).json({ message: 'Event not found or unauthorized' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting event' });
  }
});

// POST create job
app.post('/api/jobs', authMiddleware, async (req, res) => {
  await ensureDB();
  try {
    const newJob = new Job({
      ...req.body,
      sentTo: req.admin.email,
    });
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating job' });
  }
});

// PUT update job
app.put('/api/jobs/:eventId', authMiddleware, async (req, res) => {
  await ensureDB();
  try {
    const job = await Job.findOneAndUpdate(
      { eventId: req.params.eventId },
      { $set: req.body },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

module.exports = app; // Vercel treats this as a serverless function
