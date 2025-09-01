const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const auth = require('../middleware/middleware');

// POST /signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    let admin = await Admin.findOne({ email });
    if (admin) return res.status(400).json({ msg: 'Admin already exists' });

    const hashed = await bcrypt.hash(password, 10);
    admin = new Admin({ email, password: hashed });
    await admin.save();

    const token = jwt.sign({ admin: { email: admin.email } }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ admin: { email: admin.email } }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// GET /profile (Protected)
router.get('/profile', auth, async (req, res) => {
  const admin = await Admin.findByEmail(req.admin.email).select('-password');
  const profile={
    email:admin?.email,
    username:admin?.email.split('@')[0]
  }
  res.json(profile);
});

module.exports = router;
