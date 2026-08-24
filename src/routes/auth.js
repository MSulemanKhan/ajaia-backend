const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { state, persist } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const BCRYPT_COST = Number(process.env.BCRYPT_COST) || 10;

function publicUser(user) {
  return { id: user.id, username: user.username, displayName: user.displayName };
}

function issueToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', (req, res) => {
  const { username, password, displayName } = req.body || {};
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const normalized = username.trim().toLowerCase();
  if (state.users.some((u) => u.username === normalized)) {
    return res.status(409).json({ error: 'Username is already taken' });
  }
  const user = {
    id: crypto.randomUUID(),
    username: normalized,
    displayName: (displayName && displayName.trim()) || normalized,
    passwordHash: bcrypt.hashSync(password, BCRYPT_COST),
    createdAt: new Date().toISOString()
  };
  state.users.push(user);
  persist();
  res.status(201).json({ token: issueToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const normalized = String(username).trim().toLowerCase();
  const user = state.users.find((u) => u.username === normalized);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  res.json({ token: issueToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = { router, publicUser };
