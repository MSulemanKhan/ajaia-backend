const os = require('os');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

process.env.JWT_SECRET = 'test-secret';
process.env.BCRYPT_COST = '4';
// Precompute once and reuse — bcryptjs is pure JS and re-hashing per test blows past Jest's default timeout.
process.env.DEMO_PASSWORD_HASH = bcrypt.hashSync('password123', 4);

function freshApp() {
  process.env.DB_FILE = path.join(os.tmpdir(), `ajaia-test-db-${crypto.randomUUID()}.json`);
  jest.resetModules();
  return require('../src/app');
}

module.exports = { freshApp };
