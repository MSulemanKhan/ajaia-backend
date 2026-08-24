const express = require('express');
const { state } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { publicUser } = require('./auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const others = state.users.filter((u) => u.id !== req.user.id).map(publicUser);
  res.json({ users: others });
});

module.exports = router;
