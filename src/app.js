const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { router: authRouter } = require('./routes/auth');
const usersRouter = require('./routes/users');
const documentsRouter = require('./routes/documents');
const uploadRouter = require('./routes/upload');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/upload', uploadRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const clientDist = path.join(__dirname, '..', 'client', 'dist', 'client', 'browser');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(200).json({ message: 'Backend is running. Client build not found — run `npm run build`.' });
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
