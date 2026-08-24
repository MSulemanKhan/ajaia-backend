const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { marked } = require('marked');
const { state, persist } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_EXTENSIONS = new Set(['.txt', '.md']);
const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    }
    cb(null, true);
  }
});

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function txtToHtml(text) {
  return text
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line) || '<br>'}</p>`)
    .join('');
}

router.post('/', requireAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.message === 'UNSUPPORTED_FILE_TYPE') {
        return res.status(400).json({ error: 'Only .txt and .md files are supported' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large (max 1MB)' });
      }
      return res.status(400).json({ error: 'Could not process the uploaded file' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const text = req.file.buffer.toString('utf-8');
    const contentHtml = ext === '.md' ? marked.parse(text) : txtToHtml(text);
    const title = path.basename(req.file.originalname, ext) || 'Imported document';
    const now = new Date().toISOString();

    const doc = {
      id: crypto.randomUUID(),
      ownerId: req.user.id,
      title,
      contentHtml,
      createdAt: now,
      updatedAt: now
    };
    state.documents.push(doc);
    persist();

    res.status(201).json({
      document: {
        id: doc.id,
        title: doc.title,
        ownerId: doc.ownerId,
        contentHtml: doc.contentHtml,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        accessLevel: 'owner'
      }
    });
  });
});

module.exports = router;
