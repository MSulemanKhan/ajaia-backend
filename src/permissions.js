function getAccessLevel(doc, userId, shares) {
  if (!doc || !userId) return null;
  if (doc.ownerId === userId) return 'owner';
  const share = shares.find((s) => s.documentId === doc.id && s.userId === userId);
  if (share) return share.permission;
  return null;
}

function canView(level) {
  return level === 'owner' || level === 'edit' || level === 'view';
}

function canEdit(level) {
  return level === 'owner' || level === 'edit';
}

module.exports = { getAccessLevel, canView, canEdit };
