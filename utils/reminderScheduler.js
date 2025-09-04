const nodemailer = require('nodemailer');
const fetch = require('node-fetch'); // serverless-friendly fetch

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS,
  },
});

async function sendReminderEmail(to, title, eventDate) {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to,
    subject: `Reminder: "${title}" event in 5 minutes`,
    text: `Hello,\n\nThis is a reminder for your event: "${title}" scheduled at ${new Date(eventDate).toLocaleString()}.\n\n- Your Event Dashboard`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Reminder email sent:', info.response);
  } catch (err) {
    console.error('Failed to send email reminder:', err);
  }
}

/**
 * Serverless-friendly scheduler
 * Just sends reminder immediately if event is CONFIRMED
 */
async function scheduleEventReminder(event) {
  if (event.status !== 'CONFIRMED') {
    // Update job in DB to FAILED
    try {
      await fetch(`${process.env.API_URL}/api/jobs/${event.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'FAILED',
          motifFailure: `Event status changed to ${event.status}.`,
        }),
      });
    } catch (err) {
      console.error('Failed to update job as FAILED:', err);
    }
    return;
  }

  const eventDate = new Date(event.date);
  const reminderDate = new Date(eventDate.getTime() - 5 * 60000);

  if (reminderDate <= new Date()) {
    console.log(`Too late to send reminder for "${event.title}"`);
    return;
  }

  // Send email immediately (serverless-friendly)
  await sendReminderEmail(event.createdBy, event.title, event.date);

  // Mark job as SENT
  try {
    await fetch(`${process.env.API_URL}/api/jobs/${event.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'SENT',
        updatedOn: new Date(),
      }),
    });
  } catch (err) {
    console.error('Failed to update job as SENT:', err);
  }
}

module.exports = { scheduleEventReminder };
