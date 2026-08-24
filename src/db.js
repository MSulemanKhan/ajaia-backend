const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'db.json');

const BCRYPT_COST = Number(process.env.BCRYPT_COST) || 10;

function seedData() {
  const now = new Date().toISOString();
  const demoPasswordHash = process.env.DEMO_PASSWORD_HASH || bcrypt.hashSync('password123', BCRYPT_COST);
  return {
    users: [
      { id: 'demo1', username: 'demo1', displayName: 'Demo One', passwordHash: demoPasswordHash, createdAt: now },
      { id: 'demo2', username: 'demo2', displayName: 'Demo Two', passwordHash: demoPasswordHash, createdAt: now }
    ],
    documents: [],
    shares: []
  };
}

function load() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial = seedData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    const initial = seedData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

const state = load();

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

module.exports = { state, persist };
