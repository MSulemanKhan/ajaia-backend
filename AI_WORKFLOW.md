# AI Workflow Note

## Tools used

Claude Code (Sonnet 5), used as the primary pair-programmer for the entire build in one
guided session — architecture discussion, implementation, testing, and browser verification.

## Where AI materially sped things up

**A dedicated validation pass before writing any code.** Before scaffolding anything, I had
it research the specific stack combination (Express 5, Angular 21, Render free tier) and
report concrete risks rather than starting from general best practices. That pass surfaced
four things I would very likely have hit mid-build and had to debug live instead:

- `lowdb` (my first instinct for file-based persistence) is ESM-only and would have broken
  against this CommonJS backend the moment it was required.
- Express 5 rejects a bare `'*'` catch-all route at boot (a path-to-regexp breaking change)
  — the SPA-fallback route needed different syntax than Express 4 muscle memory.
- Render's free-tier disk resets on spin-down/wake, not just on redeploy — I'd assumed the
  narrower (and wrong) version of that caveat.
- Angular 21's zoneless-by-default change detection means plain field mutation inside an
  async callback silently fails to re-render; state populated from HTTP responses needs to be
  a signal, not a plain property.

Catching all four before writing a single route or component turned four potential
mid-build debugging sessions into four design decisions made up front.

**Full-stack scaffolding speed.** Backend routes/middleware/tests and the Angular
services/components/routing were generated quickly enough that most of the session's time
went to reviewing and steering rather than typing boilerplate.

**Verification, not just generation.** Beyond `ng build` succeeding, it wrote a Node script
hitting every API endpoint directly (auth, sharing, access control, upload — including the
negative cases: wrong password, unsupported file type, blocked access) and a Playwright
script that drove an actual headless browser through the full user journey — login, create a
document, apply every formatting control, rename, wait for autosave, refresh and confirm
persistence, share with a second account, log in as that account, confirm shared access and
edit rights, upload a file — with screenshots at each step and a check for browser console
errors. That's what "verified it works" means in the submission, not just "it compiled."

## What AI-generated output I changed or rejected

- **Rejected `ngx-quill` (and third-party rich-text libraries generally) in favor of a
  hand-rolled `contenteditable` + `execCommand` editor.** The validation pass's read was
  that ngx-quill would probably work against Angular 21, but "probably" against a very
  recently released Angular major, for five formatting features that don't need a library,
  wasn't worth the dependency-resolution risk on a fixed time budget. I made this call
  explicitly rather than defaulting to the more common library approach — see
  `ARCHITECTURE.md` for the full reasoning.
- **Rejected `lowdb`**, once the validation pass flagged the ESM/CommonJS mismatch, in favor
  of a ~30-line hand-written JSON read/write module. Simpler than working around a library's
  module-format constraint for a feature that small.
- **Fixed a real bug in the first test run, not just a timeout.** The seeded demo users hash
  their password with bcrypt at a cost factor high enough that re-seeding for every Jest test
  blew past the default 5-second hook timeout. The fix that was proposed first was just
  raising the timeout — I pushed back on that because it papers over real per-test latency
  instead of addressing it, and asked for the cost factor to be configurable with a
  precomputed hash in tests instead, which is what shipped.
- **Fixed a TypeScript field-initializer ordering bug** across three Angular components
  (class fields that referenced constructor-injected services before the constructor had run)
  — caught by the compiler, fixed by switching those services to `inject()`.
- **Fixed a broken SCSS selector.** An initial `:global()` selector in the rich-text editor's
  styles doesn't exist in Angular/Sass and was a silent no-op — content injected via raw
  `innerHTML` never receives Angular's scoped-style attribute, so headings/lists typed into
  the editor wouldn't have been styled at all. Caught by inspecting the generated CSS
  behavior, not by a compiler error, and fixed with `ViewEncapsulation.None` scoped manually
  under `:host` instead of leaving it broken.

## How I verified correctness, UX quality, and reliability

1. **Automated tests**: 8 Jest/Supertest tests covering registration, login, wrong-password
   rejection, and — the highest-risk logic in the app — sharing access control (blocked
   before a share exists, allowed after, view-only permissions can't edit or manage sharing,
   only the owner can delete/share).
2. **A real production build** (`ng build`), not just `ng serve`, to confirm the app actually
   compiles for deployment and that the output path matches what Express serves.
3. **A direct API smoke test** hitting every endpoint (including negative cases) before
   touching the UI at all, to separate backend bugs from frontend bugs.
4. **A full headless-browser run of the entire user journey** with screenshots at each step
   and a check for browser console errors — the thing that actually proves the product works
   for a user, versus proving the code merely runs.
