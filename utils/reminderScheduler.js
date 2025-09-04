const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const axios = require('axios');

const VERCEL_URL = process.env.VERCEL_URL; // e.g. "https://your-project.vercel.app"
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // JWT token for auth

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS,
  },
});

function sendReminderEmail(to, title, eventDate) {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to,
    subject: `Reminder: "${title}" event in 5 minutes`,
    text: `Hello,\n\nThis is a reminder for your event: "${title}" scheduled at ${new Date(eventDate).toLocaleString()}.\n\n- Your Event Dashboard`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Failed to send email reminder:', error);
    } else {
      console.log('Reminder email sent:', info.response);
    }
  });
}

async function updateJobStatus(eventId, status, motifFailure = null) {
  try {
    await axios.put(`${VERCEL_URL}/api/jobs/${eventId}`, {
      status,
      motifFailure,
      updatedOn: new Date(),
    }, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`Job ${eventId} updated to ${status}`);
  } catch (err) {
    console.error(`Failed to update job ${eventId}:`, err.message);
  }
}

function scheduleEventReminder(event) {
  const jobName = `reminder-${event.id}`;
  const eventDate = new Date(event.date);
  const reminderDate = new Date(eventDate.getTime() - 5 * 60000); // 5 minutes before

  // Cancel existing job if status not CONFIRMED
  if (event.status !== 'CONFIRMED') {
    const existingJob = schedule.scheduledJobs[jobName];
    if (existingJob) existingJob.cancel();

    updateJobStatus(event.id, 'FAILED', `Event status changed to ${event.status}`);
    return;
  }

  // Schedule email if reminder time is in the future
  if (reminderDate > new Date()) {
    schedule.scheduleJob(jobName, reminderDate, async () => {
      try {
        sendReminderEmail(event.createdBy, event.title, event.date);
        await updateJobStatus(event.id, 'SENT');
      } catch (err) {
        console.error('Failed to send reminder or update job:', err.message);
      }
    });

    console.log(`Reminder scheduled for "${event.title}" at ${reminderDate.toLocaleString()}`);
  } else {
    console.log(`Too late to schedule reminder for "${event.title}"`);
  }
}

module.exports = { scheduleEventReminder };
