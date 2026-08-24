# Submission

## Live product

https://ajaia-backend-qoc6.onrender.com/

Free-tier Render service — the first request after a period of inactivity can take
30-60 seconds to wake up.

## Demo accounts

| Username | Password    |
|----------|-------------|
| `demo1`  | `password123` |
| `demo2`  | `password123` |

Both are seeded automatically on first boot. Log in as `demo1`, create/share a document with
`demo2`, then log in as `demo2` (or use the one-click "Log in as demo1/demo2" buttons on the
login screen) to see the sharing flow from both sides.

## What's included in this folder

- `src/`, `server.js`, `package.json` — the Express backend (auth, documents, sharing,
  upload, static-serving of the built frontend).
- `client/` — the Angular frontend source.
- `tests/` — Jest + Supertest backend test suite (`npm test`).
- `README.md` — setup/run instructions.
- `ARCHITECTURE.md` — priorities, data model, API surface, and the reasoning behind the main
  tradeoffs.
- `AI_WORKFLOW.md` — how AI tools were used, what was rejected/changed, how correctness was
  verified.
- `WALKTHROUGH_VIDEO.txt` — the recorded walkthrough link.

## What's working

- Create, rename, edit, and reopen documents; content autosaves with a visible save-state
  indicator.
- Rich text: bold, italic, underline, headings (H1/H2), bulleted and numbered lists.
- File upload: `.txt` and `.md` import directly into a new editable document (other types are
  rejected with a clear message); markdown is converted to HTML.
- Sharing: owner can grant "can edit" or "can view" access to another user and revoke it
  later; dashboard clearly separates "My documents" from "Shared with me" (with owner name
  and permission level shown for shared docs).
- Real auth (bcrypt + JWT) with two seeded demo accounts for zero-setup review.
- Access control is enforced server-side and covered by automated tests, not just hidden in
  the UI.

## What's incomplete / known limitations

- **Persistence is a JSON file**, not a database — chosen to avoid native-module build risk
  and extra infrastructure for this scope. Render's free tier has no persistent disk, so data
  resets on redeploy *and* on spin-down/wake from inactivity (the two demo accounts always
  come back since they're re-seeded on boot; anything else you create may not survive an idle
  period between review sessions).
- **No document deletion in the UI** — the API supports it (`DELETE /api/documents/:id`), it's
  just not wired into the dashboard yet.
- **No real-time co-editing** — single-editor-at-a-time with autosave, no live cursors or
  conflict resolution if two people edit the same document at once (last write wins, silently).
- **No frontend automated tests** — deprioritized in favor of backend access-control tests
  given the time budget (see `ARCHITECTURE.md` for the reasoning).

## What I'd build next with another 2-4 hours

1. Move persistence to Render's free Postgres so data survives spin-down.
2. Wire up document delete/rename actions directly from the dashboard.
3. Add a version counter and a "this document changed, reload?" prompt for basic conflict
   awareness between two editors.
4. Add frontend component tests for the rich-text editor and share dialog.
5. Server-side HTML sanitization (e.g. `sanitize-html`) as defense-in-depth alongside the
   client-side `DomSanitizer` pass already in place.
