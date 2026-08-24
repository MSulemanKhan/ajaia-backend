# Ajaia Docs

A simple collaborative document editor, like a small version of Google Docs. You can create
documents, format text, upload files, and share documents with other people.

**Live app:** https://ajaia-backend-qoc6.onrender.com/

**Test accounts** (already created, no sign-up needed):
- `demo1` / `password123`
- `demo2` / `password123`

Log in as `demo1`, create a document, share it with `demo2`, then log in as `demo2` to see it.
There are one-click "Log in as demo1/demo2" buttons on the login page too.

> This runs on Render's free plan. If the app hasn't been used in a while, it goes to sleep,
> and the first request after that can take 30-60 seconds to load.

## What it's built with

- **Backend:** Node.js + Express, a JSON file for storage, JWT for login sessions.
- **Frontend:** Angular.
- **Tests:** Jest + Supertest.
- Everything runs from one Render service — the backend also serves the frontend files, so
  there's only one URL for the whole app.

## Project folders

```
test-backend/
  src/            backend code: routes, login/auth, data storage
  tests/          backend tests
  client/         frontend code (Angular)
  data/           where documents get saved (created automatically, not in git)
  server.js       starts the backend
```

## Running it on your own computer

You need Node 18 or newer.

**1. Install everything:**

```bash
npm install
cd client && npm install && cd ..
```

**2. Run the frontend:**

```bash
cd client
npm start
```

Open http://localhost:4200. By default this talks to the live backend on Render
(`client/proxy.conf.json`), so you don't need to run a backend yourself just to work on the
frontend.

If you want to test backend changes, run the backend locally too, in a second terminal:

```bash
npm run dev
```

and change the target in `client/proxy.conf.json` back to `http://localhost:3000`.

**3. Or run it the same way Render does (one server for everything):**

```bash
npm run build   # builds the frontend into client/dist/client/browser
npm start       # Express serves both the frontend and the API on http://localhost:3000
```

## Running the tests

```bash
npm test
```

This checks registration, login, and the sharing rules — for example, that someone can't open
a document unless they own it or it's been shared with them.

## What it can do

- Create, rename, edit, and reopen documents.
- Format text: bold, italic, underline, headings, bullet and numbered lists.
- Autosave — no save button to remember, it saves about a second after you stop typing.
- Upload a `.txt` or `.md` file and it turns into a new document.
- Share a document with another user, as "can edit" or "can view," and remove access later.
- Copy a link to a document to send to someone.
- Real login (passwords are hashed, sessions use tokens), plus two ready-made test accounts.

## Things that aren't finished (on purpose, to fit the time I had)

- **Storage is a plain JSON file, not a real database.** This keeps things simple with nothing
  extra to set up, but Render's free plan can wipe this file when the app restarts or goes to
  sleep from being unused. The two test accounts always come back since they're recreated on
  startup; anything else you create might not survive between sessions.
- No real-time co-editing (like Google Docs showing someone else typing live) — one person
  edits at a time, with autosave.
- No delete button in the document list yet (the backend supports deleting, it's just not
  connected to a button).
- No frontend tests — I put my testing time into the backend sharing rules instead, since
  that's the part most likely to have a real bug.

More on why I made these choices is in `ARCHITECTURE.md`.
