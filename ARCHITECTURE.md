# Architecture Notes

## What I focused on

I had a few hours, so I picked a small number of things to get right, instead of trying to
build everything:

1. **The sharing rules had to actually work.** This is the part most likely to have a bug —
   can this person open this document, can they edit it — so it's the one part with automated
   tests, not just manual clicking around.
2. **One deployment, one link.** The backend serves the frontend files itself, so there's only
   one URL, and no CORS problems to run into.
3. **A text editor that's simple and just works,** instead of a fancier one that might break
   partway through the project.
4. Everything else (file upload, autosave, test accounts) is there to make the first five
   minutes of testing this app smooth, not to pad out the feature list.

## How data is stored

Everything lives in one JSON file (`data/db.json`), split into three lists:

- `users`: id, username, name, hashed password, date created
- `documents`: id, owner, title, content, dates
- `shares`: which document, which user, and whether they can edit or just view

One function decides what a user is allowed to do with a document
(`src/permissions.js`, `getAccessLevel()`). Every route uses this same function, so the rule
for "can this person see this" only exists in one place, not copied into every route.

## API routes

```
POST   /api/auth/register        create an account
POST   /api/auth/login
GET    /api/auth/me
GET    /api/users                other users, for the share dropdown

GET    /api/documents             your documents + ones shared with you
POST   /api/documents             create a document
GET    /api/documents/:id
PUT    /api/documents/:id         update title or content
DELETE /api/documents/:id         owner only
POST   /api/documents/:id/share       owner only
DELETE /api/documents/:id/share/:userId  owner only

POST   /api/upload                turn a .txt/.md file into a new document
```

## Decisions I made, and why

**One server for both frontend and backend.** The Angular app gets built into plain HTML/CSS/JS
files, and Express serves them directly, alongside the API. That means one URL to test the
whole app on, and nothing extra to CORS-configure or host separately. The trade-off: the build
step now does a nested install-and-build inside the `client` folder, which looks a little
unusual the first time you read it.

**I wrote my own text editor instead of using a library.** The frontend uses a very recently
released version of Angular, and I didn't want to gamble time on a third-party editor library
possibly not playing well with it. The formatting this project needs — bold, italic, underline,
headings, lists — doesn't actually need a library at all. It's built directly with a plain
editable `<div>` and the browser's built-in text-formatting commands. If this were becoming a
real product, I'd switch to a proper editor library later, for things like cleaning up pasted
content or adding tables.

**A JSON file instead of a real database.** Setting up a database takes real time, and adds
things that can quietly fail (like a database driver not installing correctly on the hosting
service). For three small lists of data with no complicated queries, a plain file does the job.
The real cost isn't the file format — it's that Render's free plan doesn't keep files around
forever. They can get wiped when the app restarts or wakes up from sleeping, not only when I
redeploy it. That's called out clearly in the README so it doesn't look like a bug. With more
time, I'd move this to a real database (Render has a free Postgres option) — the rest of the
code wouldn't need to change much, just the storage file itself.

**The frontend needs one specific habit for updating the screen.** The Angular version used
here doesn't automatically refresh the screen the same way older versions did — some values
need to be written a specific way (through something called a "signal") so the page actually
updates after data comes back from the server. I used this pattern everywhere in the app,
rather than fixing it one screen at a time as bugs showed up.

**Two ready-made test accounts, but real login otherwise.** Signing up and logging in are
both real (hashed passwords, real sessions) — but `demo1` and `demo2` get created
automatically the first time the app starts, so anyone testing this can try the sharing
feature right away, without creating two accounts first.

## What I'd build next with more time

1. **Real storage.** Swap the JSON file for a real database, so data survives the app
   restarting or sleeping.
2. **Delete/rename buttons** on the document list (the backend already supports deleting a
   document, it's just not connected to a button yet).
3. **Basic warning for editing conflicts.** Right now if two people edit the same document at
   once, whoever saves last just overwrites the other — a simple "this document changed,
   reload?" message would be a good first step.
4. **Frontend tests.** I put my testing time into the backend sharing rules instead, since
   that's the higher-risk logic — a next pass would add tests for the text editor and the
   share dialog.
5. **Extra safety checks on the server** for content people paste into documents, on top of
   what's already there.
