const request = require('supertest');
const { freshApp } = require('./testUtils');

async function loginAs(app, username) {
  const res = await request(app).post('/api/auth/login').send({ username, password: 'password123' });
  return res.body.token;
}

describe('document sharing and access control', () => {
  let app;
  let demo1Token;
  let demo2Token;

  beforeEach(async () => {
    app = freshApp();
    demo1Token = await loginAs(app, 'demo1');
    demo2Token = await loginAs(app, 'demo2');
  });

  test('owner can create and read their own document', async () => {
    const create = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${demo1Token}`)
      .send({ title: 'My Doc' });
    expect(create.status).toBe(201);
    expect(create.body.document.accessLevel).toBe('owner');

    const get = await request(app)
      .get(`/api/documents/${create.body.document.id}`)
      .set('Authorization', `Bearer ${demo1Token}`);
    expect(get.status).toBe(200);
    expect(get.body.document.title).toBe('My Doc');
  });

  test('a non-owner without a share is blocked, and gains access once shared', async () => {
    const create = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${demo1Token}`)
      .send({ title: 'Private Doc' });
    const docId = create.body.document.id;

    const blocked = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${demo2Token}`);
    expect(blocked.status).toBe(403);

    const share = await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('Authorization', `Bearer ${demo1Token}`)
      .send({ username: 'demo2', permission: 'edit' });
    expect(share.status).toBe(201);

    const allowed = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${demo2Token}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.document.accessLevel).toBe('edit');

    const edit = await request(app)
      .put(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${demo2Token}`)
      .send({ contentHtml: '<p>edited by demo2</p>' });
    expect(edit.status).toBe(200);
    expect(edit.body.document.contentHtml).toBe('<p>edited by demo2</p>');
  });

  test('view-only shares cannot edit, and only the owner can share or delete', async () => {
    const create = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${demo1Token}`)
      .send({ title: 'View Only Doc' });
    const docId = create.body.document.id;

    await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('Authorization', `Bearer ${demo1Token}`)
      .send({ username: 'demo2', permission: 'view' });

    const editAttempt = await request(app)
      .put(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${demo2Token}`)
      .send({ contentHtml: '<p>should not work</p>' });
    expect(editAttempt.status).toBe(403);

    const shareAttempt = await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('Authorization', `Bearer ${demo2Token}`)
      .send({ username: 'demo2', permission: 'edit' });
    expect(shareAttempt.status).toBe(403);

    const deleteAttempt = await request(app)
      .delete(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${demo2Token}`);
    expect(deleteAttempt.status).toBe(403);
  });

  test('a document not shared with a user is absent from their document list', async () => {
    const create = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${demo1Token}`)
      .send({ title: 'Unshared Doc' });

    const list = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${demo2Token}`);
    expect(list.status).toBe(200);
    expect(list.body.owned).toEqual([]);
    expect(list.body.shared).toEqual([]);

    await request(app)
      .post(`/api/documents/${create.body.document.id}/share`)
      .set('Authorization', `Bearer ${demo1Token}`)
      .send({ username: 'demo2', permission: 'view' });

    const listAfterShare = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${demo2Token}`);
    expect(listAfterShare.body.shared).toHaveLength(1);
    expect(listAfterShare.body.owned).toEqual([]);
  });
});
