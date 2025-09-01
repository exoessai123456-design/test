const schedule = require('node-schedule');
const nodemailer = require('nodemailer');

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


/* function scheduleEventReminder(event) {
  if (event.status !== 'CONFIRMED') return;

  const eventDate = new Date(event.date);
  const reminderDate = new Date(eventDate.getTime() - 5 * 60000);

  if (reminderDate > new Date()) {
    const jobName = `reminder-${event._id}`;

    schedule.scheduleJob(jobName, reminderDate, () => {
      sendReminderEmail(event.createdBy, event.title, event.date);
    });

    console.log(`Reminder scheduled for event "${event.title}" at ${reminderDate.toLocaleString()}`);
  }
} */


function scheduleEventReminder (event) {
  const jobName = `reminder-${event.id}`;
  const eventDate = new Date(event.date);
  const reminderDate = new Date(eventDate.getTime() - 5 * 60000);

  if (event.status !== 'CONFIRMED') {
    // Cancel any existing scheduled job
    const existingJob = schedule.scheduledJobs[jobName];
    if (existingJob) {
      existingJob.cancel();
    }

    // Update job in DB to FAILED
    fetch(`http://localhost:5000/api/jobs/${event.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbiI6eyJlbWFpbCI6ImV4b2Vzc2FpMTIzNDU2QGdtYWlsLmNvbSJ9LCJpYXQiOjE3NTMyMDgwNzZ9.CAPpp0U-pBKOsR4THZQ3YAtDWOMx6KsMWPeHn2tLGYU`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'FAILED',
        motifFailure: `Event status changed to ${event.status}.`,
      }),
    }).catch(err => console.error('Failed to update job as FAILED:', err));

    return;
  }

  // If reminder date is still in the future
  if (reminderDate > new Date()) {
    schedule.scheduleJob(jobName, reminderDate, async () => {
      try {
        await sendReminderEmail(event.createdBy, event.title, event.date);

        // Mark job as SENT
        await fetch(`http://localhost:5000/api/jobs/${event.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbiI6eyJlbWFpbCI6ImV4b2Vzc2FpMTIzNDU2QGdtYWlsLmNvbSJ9LCJpYXQiOjE3NTMyMDgwNzZ9.CAPpp0U-pBKOsR4THZQ3YAtDWOMx6KsMWPeHn2tLGYU`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'SENT',
            updatedOn: new Date()
          }),
        });
      } catch (err) {
        console.error('Failed to send reminder or update job:', err);
      }
    });

    console.log(`Reminder scheduled for event "${event.title}" at ${reminderDate.toLocaleString()}`);
  }
   else {
    console.log(`Too late to schedule reminder for "${event.title}"`);
  }
};


module.exports = {
  scheduleEventReminder,
};
