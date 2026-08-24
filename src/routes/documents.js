const express = require('express');
const crypto = require('crypto');
const { state, persist } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getAccessLevel, canView, canEdit } = require('../permissions');
const { publicUser } = require('./auth');

const router = express.Router();

function userById(id) {
  return state.users.find((u) => u.id === id);
}

function summarize(doc, level) {
  const owner = userById(doc.ownerId);
  return {
    id: doc.id,
    title: doc.title,
    ownerId: doc.ownerId,
    ownerName: owner ? owner.displayName : 'Unknown',
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
    accessLevel: level
  };
}

router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;
  const owned = [];
  const shared = [];
  for (const doc of state.documents) {
    const level = getAccessLevel(doc, userId, state.shares);
    if (level === 'owner') owned.push(summarize(doc, level));
    else if (canView(level)) shared.push(summarize(doc, level));
  }
  owned.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  shared.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json({ owned, shared });
});

router.post('/', requireAuth, (req, res) => {
  const { title, contentHtml } = req.body || {};
  const now = new Date().toISOString();
  const doc = {
    id: crypto.randomUUID(),
    ownerId: req.user.id,
    title: (title && String(title).trim()) || 'Untitled document',
    contentHtml: typeof contentHtml === 'string' ? contentHtml : '',
    createdAt: now,
    updatedAt: now
  };
  state.documents.push(doc);
  persist();
  res.status(201).json({ document: { ...summarize(doc, 'owner'), contentHtml: doc.contentHtml } });
});

router.get('/:id', requireAuth, (req, res) => {
  const doc = state.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const level = getAccessLevel(doc, req.user.id, state.shares);
  if (!canView(level)) return res.status(403).json({ error: 'You do not have access to this document' });

  const response = { ...summarize(doc, level), contentHtml: doc.contentHtml };
  if (level === 'owner') {
    response.shares = state.shares
      .filter((s) => s.documentId === doc.id)
      .map((s) => ({ ...publicUser(userById(s.userId)), permission: s.permission }));
  }
  res.json({ document: response });
});

router.put('/:id', requireAuth, (req, res) => {
  const doc = state.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const level = getAccessLevel(doc, req.user.id, state.shares);
  if (!canEdit(level)) return res.status(403).json({ error: 'You do not have edit access to this document' });

  const { title, contentHtml } = req.body || {};
  if (typeof title === 'string') {
    const trimmed = title.trim();
    if (!trimmed) return res.status(400).json({ error: 'Title cannot be empty' });
    doc.title = trimmed;
  }
  if (typeof contentHtml === 'string') {
    doc.contentHtml = contentHtml;
  }
  doc.updatedAt = new Date().toISOString();
  persist();
  res.json({ document: { ...summarize(doc, level), contentHtml: doc.contentHtml } });
});

router.delete('/:id', requireAuth, (req, res) => {
  const doc = state.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can delete this document' });

  state.documents = state.documents.filter((d) => d.id !== doc.id);
  state.shares = state.shares.filter((s) => s.documentId !== doc.id);
  persist();
  res.status(204).end();
});

router.post('/:id/share', requireAuth, (req, res) => {
  const doc = state.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can share this document' });

  const { username, permission } = req.body || {};
  if (!username) return res.status(400).json({ error: 'A username is required' });
  const normalizedPermission = permission === 'view' ? 'view' : 'edit';
  const target = state.users.find((u) => u.username === String(username).trim().toLowerCase());
  if (!target) return res.status(404).json({ error: 'No user found with that username' });
  if (target.id === doc.ownerId) return res.status(400).json({ error: 'The owner already has full access' });

  const existing = state.shares.find((s) => s.documentId === doc.id && s.userId === target.id);
  if (existing) existing.permission = normalizedPermission;
  else state.shares.push({ documentId: doc.id, userId: target.id, permission: normalizedPermission });
  persist();

  const shares = state.shares
    .filter((s) => s.documentId === doc.id)
    .map((s) => ({ ...publicUser(userById(s.userId)), permission: s.permission }));
  res.status(201).json({ shares });
});

router.delete('/:id/share/:userId', requireAuth, (req, res) => {
  const doc = state.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.ownerId !== req.user.id) return res.status(403).json({ error: 'Only the owner can modify sharing' });

  state.shares = state.shares.filter((s) => !(s.documentId === doc.id && s.userId === req.params.userId));
  persist();
  const shares = state.shares
    .filter((s) => s.documentId === doc.id)
    .map((s) => ({ ...publicUser(userById(s.userId)), permission: s.permission }));
  res.json({ shares });
});

module.exports = router;
