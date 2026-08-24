# Architecture Note

## What I prioritized

Given a 4-6 hour budget, I optimized for a small set of things working correctly end-to-end
over a larger set of things half-working:

1. **Correct, tested sharing/access control.** This is the feature most likely to have a
   subtle bug (view vs. edit, owner-only actions, a doc a user shouldn't see), so it's the
   one thing with an automated test suite rather than just manual verification.
2. **A single, reliable deployment.** One Render service, one URL, no second free-tier
   signup, no CORS configuration to get wrong. Reviewers shouldn't need multiple links or
   hit a broken cross-origin request on their first try.
3. **A rich-text editor that's simple and definitely works**, over a fancier one that risks
   a dependency-compatibility problem eating the time budget (see below).
4. Everything else (upload, autosave, demo accounts) exists to make the reviewer's first five
   minutes smooth, not to add feature surface for its own sake.

## Data model

Three flat collections in a single JSON file (`data/db.json`):

- `users`: `{ id, username, displayName, passwordHash, createdAt }`
- `documents`: `{ id, ownerId, title, contentHtml, createdAt, updatedAt }`
- `shares`: `{ documentId, userId, permission: 'view' | 'edit' }`

Access control is centralized in one place (`src/permissions.js`'s `getAccessLevel()`),
returning `'owner' | 'edit' | 'view' | null`, so every route and the test suite check
permissions the same way instead of each route re-implementing the logic.

## API surface

```
POST   /api/auth/register        { username, password, displayName? }
POST   /api/auth/login           { username, password }
GET    /api/auth/me
GET    /api/users                other users, for the share picker

GET    /api/documents            { owned: [...], shared: [...] }
POST   /api/documents            { title } -> new blank document
GET    /api/documents/:id
PUT    /api/documents/:id        { title?, contentHtml? }
DELETE /api/documents/:id        owner only
POST   /api/documents/:id/share       { username, permission } -> owner only
DELETE /api/documents/:id/share/:userId -> owner only

POST   /api/upload               multipart file -> new document (.txt/.md only)
```

## Key tradeoffs and why

**Monorepo, single Render service, instead of separate frontend/backend deploys.**
Express serves the built Angular app as static files, with API routes under `/api/*` and an
unpathed catch-all (`app.use((req, res) => ...)`) that returns `index.html` for client-side
routes. One URL to hand a reviewer, no CORS in production, no second free static host to
provision. The cost: the build step (`npm run build`) now does a nested `cd client && npm
install && npm run build`, which is a little unusual to read the first time.

**Hand-rolled rich-text editor instead of a library (e.g. ngx-quill/TipTap).** The frontend
is Angular 21, released very recently — before committing to a third-party editor wrapper, I
had an independent pass check its Angular-version compatibility, since a peer-dependency
mismatch mid-build would have been a bad way to lose an hour. The check came back
reasonably confident ngx-quill would work, but the five required formatting features (bold,
italic, underline, headings, lists) don't need a library at all: a `contenteditable` div +
`document.execCommand`, wrapped in a `ControlValueAccessor` for Reactive Forms integration,
covers the requirement with zero dependency-resolution risk and a CSS/asset footprint I fully
control. `execCommand` is formally deprecated but universally supported in evergreen
browsers, which is the right tradeoff for this scope. If this were headed to production, I'd
revisit that decision — a maintained editor library pays for itself once you need things like
paste-cleanup, tables, or collaborative cursors.

**JSON file over SQLite/Postgres.** `better-sqlite3`/`sqlite3` require native compilation,
which is exactly the kind of thing that can fail silently in a build environment you don't
fully control (Render's free-tier build image, in this case) — a risk not worth taking for a
demo with three flat collections and no complex queries. `lowdb` was the first alternative I
considered, but it's ESM-only, and converting this CommonJS backend to ESM (or juggling
dynamic `import()`) purely to use a thin wrapper around `fs.readFileSync`/`writeFileSync`
wasn't worth it — I wrote the ~30-line store directly instead. The real cost of this choice
isn't the format, it's Render's free-tier ephemeral disk: the file is lost on redeploy and on
spin-down/wake, not just on redeploy, which is called out explicitly in the README rather than
left for a reviewer to discover. A production version would move this to Render's free
Postgres (or Supabase) with the same three-table shape — the access-control logic in
`permissions.js` wouldn't need to change, only `db.js`'s read/write implementation.

**Zoneless Angular changes how state has to be written.** Angular 21 is zoneless by default,
which means a plain `this.foo = value` inside an `async`/`.subscribe()` continuation won't
reliably schedule a re-render — there's no zone.js patch left to notice it happened. Every
piece of state that's populated from an HTTP response in this app is a `signal()`, updated via
`.set()`/`.update()`, specifically because signal writes notify Angular's change-detection
scheduler directly regardless of zones. This was a deliberate, app-wide convention rather than
a per-component fix.

**Two seeded demo accounts, real auth otherwise.** Registration/login is real (bcrypt +
JWT), not mocked — but `demo1`/`demo2` are created on first boot so a reviewer can test the
sharing flow across two accounts without registering two accounts first.

## What I'd build next with another 2-4 hours

1. **Real persistence** — swap the JSON file for Render's free Postgres so documents survive
   spin-down, using the same data shape and permission logic.
2. **Document deletion in the UI** and a small "rename/delete" menu on each dashboard card
   (the API already supports delete; it's just not wired into the frontend).
3. **Frontend tests** — I deprioritized these given the time budget in favor of backend
   access-control tests (the higher-risk logic); a next pass would add component tests for
   the rich-text editor's `ControlValueAccessor` contract and the share dialog.
4. **Conflict handling for concurrent edits** — right now the last save wins with no
   warning if two people edit the same document at the same time; a version counter with a
   "this document changed, reload?" prompt would be the minimal fix short of full
   operational-transform/CRDT collaboration.
5. **Paste sanitization hardening** — content is sanitized via Angular's `DomSanitizer`
   before it's stored, but a dedicated allowlist-based HTML sanitizer (e.g. `sanitize-html`)
   on the server side would be a stronger defense-in-depth layer before persisting
   user-supplied HTML.
