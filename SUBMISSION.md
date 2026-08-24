# Submission

## Live app

https://ajaia-backend-qoc6.onrender.com/

This runs on Render's free plan. If it hasn't been used in a while, the first load can take
up to a minute while it wakes back up.

## Test accounts

| Username | Password |
|----------|----------|
| `demo1`  | `password123` |
| `demo2`  | `password123` |

Both already exist — no need to sign up. Log in as `demo1`, create a document, and share it
with `demo2`. Then log in as `demo2` (or just use the one-click "Log in as demo1/demo2"
buttons on the login page) to see it appear under "Shared with me."

## What's in this folder

- `source-code/` — the whole project: backend, frontend, and tests.
- `README.md` — how to run it.
- `ARCHITECTURE.md` — how it's built, and why.
- `AI_WORKFLOW.md` — how I used AI while building this.
- `WALKTHROUGH_VIDEO.txt` — link to the walkthrough video.
- `screenshots/` — a few screenshots of the app in use.

## What's working

- Create, rename, edit, and reopen documents.
- Formatting: bold, italic, underline, headings, bullet and numbered lists.
- Autosave.
- Upload a `.txt` or `.md` file to create a new document from it.
- Share a document as "can edit" or "can view," and remove access later.
- Copy a link to a document.
- Real login (hashed passwords, real sessions), plus two ready-made test accounts.
- Access rules are enforced on the server and covered by automated tests, not just hidden in
  the interface.

## What's not finished

- **Storage is a plain file, not a real database.** Render's free plan can wipe it when the
  app restarts or goes to sleep from being unused. The two test accounts always come back;
  other documents you create might not survive between sessions.
- No delete/rename button in the document list yet (works on the backend, just not wired up
  to a button).
- No real-time co-editing — one person edits at a time, with autosave, no live cursors.
- No frontend tests — I put my testing time into the backend sharing rules instead.

## What I'd build next with more time

1. Move storage to a real database so nothing gets lost between sessions.
2. Add delete/rename to the document list.
3. Add a basic warning if two people edit the same document at the same time.
4. Add frontend tests.
5. Add extra safety checks on the server for content people paste into documents.
