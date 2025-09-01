require('dotenv').config();
const express = require('express');
const { connectDB, Event,Job } = require('./db');
const authRoutes = require('./routes/auth');
const cors = require('cors');
const middlewaree = require('./middleware/middleware'); 
const { scheduleEventReminder } = require('./utils/reminderScheduler');



const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
connectDB();


app.get('/health', (req, res) => res.send('ok'));



app.use('/api/admin', authRoutes);

app.use('/api/events', middlewaree);

app.use('/api/jobs', middlewaree);




// ✅ GET all events by admin (not deleted)
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({
      createdBy: req.admin.email,
      status: { $ne: 'DELETED' }
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// ✅ POST create event with createdBy
app.post('/api/events', async (req, res) => {
  try {
    const newEvent = new Event({
      ...req.body,
      createdBy: req.admin.email
    });
    const savedEvent = await newEvent.save();
    scheduleEventReminder(savedEvent);
    res.status(201).json(savedEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating event' });
  }
});

// ✅ PUT update event only if belongs to this admin
app.put('/api/events/:id', async (req, res) => {
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

// ✅ DELETE (soft delete) event
app.delete('/api/events/:id', async (req, res) => {
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



// ✅ POST create job
app.post('/api/jobs', async (req, res) => {
  try {
    const newJob = new Job({
      ...req.body,
      sentTo: req.admin.email
    });
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating job' });
  }
});

/* // ✅ PUT update job only if belongs to this admin
app.put('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, sentTo: req.admin.email },
      req.body,
      { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found or unauthorized' });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating job' });
  }
}); */



app.put('/api/jobs/:eventId', async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { eventId: req.params.eventId },
      { $set: req.body },
      { new: true }
    );

    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
