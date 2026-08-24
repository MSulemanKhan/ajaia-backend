# How I Used AI

## Tools

Claude Code, for the whole project — planning it out, writing the code, testing it, and
checking it in an actual browser.

## Where it helped the most

Before writing any code, I had it check my plan for risks first: a very new version of
Angular, Express, and Render's free hosting plan, all together. That check caught a few real
problems early, before they could cost me time mid-build:

- The storage library I was planning to use (lowdb) doesn't work with the way this backend is
  written — it would have broken the app the moment it ran.
- Express's newest version doesn't allow a catch-all route the way it used to — the app
  would have crashed on startup if I'd written it the old way.
- Render's free plan wipes files not just when I redeploy, but also whenever the app goes to
  sleep from being unused and wakes back up — I had the wrong idea about this until it checked.
- This version of Angular doesn't refresh the screen automatically the same way older
  versions do. Some code needed to be written a specific way, or parts of the page just
  wouldn't update after loading data.

Catching these four things before writing a single line of code turned four likely mid-build
debugging sessions into decisions I made upfront instead.

It also moved fast on the actual build — backend routes, login, sharing rules, and the
Angular pages all came together quickly, so most of my time went into reviewing and steering
rather than typing.

And it didn't stop at "the code runs" — it wrote a script that tested every API endpoint
directly (login, sharing, uploading, including the wrong-password and bad-file-type cases),
and then a second script that opened the actual app in a real browser and clicked through the
whole thing — log in, create a document, format it, save it, refresh the page, share it with
another account, log into that account, upload a file — taking screenshots along the way and
checking for errors. That's what "I checked it works" means here, not just "it compiled."

## What I changed or said no to

- **Said no to using a text editor library.** It looked like a common library would probably
  work fine, but "probably" felt like a risk not worth taking against such a new Angular
  version, for formatting that's simple enough to build directly. See `ARCHITECTURE.md` for
  the full reasoning.
- **Said no to the storage library (lowdb)** once we found it wouldn't work with this backend,
  and wrote a small file-reading/writing module by hand instead. Simpler than working around
  a library issue for something this small.
- **Caught a real bug in the first test run, not just papered over it.** The tests kept timing
  out. The quick fix would have been to just raise the timeout. I didn't want that — it hides
  the actual problem instead of fixing it. It turned out password hashing was just slow when
  repeated for every single test, so that got fixed properly instead of masked.
- **Fixed a few code-ordering bugs**, where some code tried to use something before it was
  ready yet — caught by the type checker.
- **Fixed a styling bug** where a CSS rule was silently doing nothing, because of how one
  component was set up. This wasn't caught by any error message — it only showed up when I
  actually looked at the page and the formatting wasn't applying.

## How I checked it actually works

1. Automated tests for login and the sharing rules — 8 tests, all passing.
2. A real production build, not just the dev version, to make sure it works the way it will
   actually run once deployed.
3. A direct test of every API endpoint, including the failure cases (wrong password, wrong
   file type, blocked access), before even touching the interface.
4. A full run through the actual app in a browser — login, create, format, save, refresh,
   share, switch accounts, upload a file — with screenshots at each step and a check that
   nothing threw an error in the browser console.
