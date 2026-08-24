const request = require('supertest');
const { freshApp } = require('./testUtils');

describe('auth', () => {
  let app;

  beforeEach(() => {
    app = freshApp();
  });

  test('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'secret123', displayName: 'Alice' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe('alice');
  });

  test('rejects duplicate usernames', async () => {
    await request(app).post('/api/auth/register').send({ username: 'alice', password: 'secret123' });
    const res = await request(app).post('/api/auth/register').send({ username: 'alice', password: 'secret123' });
    expect(res.status).toBe(409);
  });

  test('logs in a seeded demo user and rejects a wrong password', async () => {
    const good = await request(app).post('/api/auth/login').send({ username: 'demo1', password: 'password123' });
    expect(good.status).toBe(200);
    expect(good.body.token).toBeTruthy();

    const bad = await request(app).post('/api/auth/login').send({ username: 'demo1', password: 'wrong' });
    expect(bad.status).toBe(401);
  });

  test('rejects requests to protected routes without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
