# ONBOARDING — Picking Up This Project From Scratch

This file is for whoever (human or LLM) needs to continue this project in a
**fresh environment/context** — i.e. you don't have the conversation history
that produced everything committed so far. Read this file fully before doing
anything else, then read the top-level `README.md` (see below — it lives
*outside* this git repo) in full too. Don't start writing code until you've
done both.

This file lives at the root of the `ts-translation/` git repo, so it travels
with every clone.

---

## 1. Project Setup — What Exists, What You Need to Rebuild

The project you're continuing lives inside a zip archive (typically named
something like `music-generation-engine-ts.zip`). If you don't have it, ask
the project owner for it before doing anything else — it contains the frozen
AS3 reference source (`as-sources/`) the TypeScript port was translated from
and checked against, and without it you have no source of truth for any
question about "did the original AS3 do this too, or is this new".

Unzipped, the archive produces this layout:

```
music-generation-engine-ts/
├── README.md            ← the full spec/instructions doc (NOT in git)
├── as-sources/           ← frozen AS3 reference, read-only, NOT in git
└── ts-translation/        ← EMPTY on a fresh unzip — this is where the git repo goes
```

**Important:** `README.md` and `as-sources/` are **not part of the git
repository** — they're reference material that sits alongside it on disk, one
level up from `ts-translation/`. Only `ts-translation/` itself is (or becomes)
a git repo. This means:

- After a fresh unzip + fresh clone, you'll have `README.md` and
  `as-sources/` sitting next to a `ts-translation/` folder that now also
  contains `.git/`, `src/`, `test/`, etc.
- If you ever lose access to the original zip but still have the git repo,
  you'll have all the *ported* TypeScript and its tests, but you'll lose the
  ability to check translation decisions against the original AS3 source or
  re-read the top-level README. Keep the zip around, or at least keep
  `README.md`/`as-sources/` backed up separately from git.

### Cloning the repo

The repo already exists on GitHub:

```
https://github.com/ciacob/music_generator_core_ts.git
```

`ts-translation/` is empty on a fresh unzip, so clone directly into it:

```bash
cd music-generation-engine-ts/ts-translation
git clone https://github.com/ciacob/music_generator_core_ts.git .
```

(The trailing `.` clones into the current — empty — directory instead of
creating a nested subfolder.)

### Git identity

Set this **locally to the repo** (not globally — don't assume you're allowed
to touch global git config in whatever environment you're in):

```bash
git config user.name "Claudius Iacob"
git config user.email "claudius.iacob@gmail.com"
```

### Getting push access (the PAT)

You will **not** have a GitHub Personal Access Token by default, and any PAT
seen in a previous conversation/session is not yours to reuse — tokens get
rotated, and blindly reusing an old one from scrollback is a bad habit to
build regardless. **Ask the project owner for a current PAT** before your
first push.

To verify the PAT works *without* creating a throwaway commit, use a
read-only check:

```bash
git ls-remote https://<github-username>:<PAT>@github.com/ciacob/music_generator_core_ts.git
```

If that lists refs without error, the PAT is valid and has at least read
access. Confirm push access for real the first time you actually have
something to commit — don't manufacture a fake commit just to test.

**Critical — never let the PAT leak into git's config:**

- Push using the token embedded directly in the URL, once, per push:
  ```bash
  git push "https://<github-username>:<PAT>@github.com/ciacob/music_generator_core_ts.git" main
  ```
- **Never** run `git remote set-url` (or `git remote add`) with the token
  baked into the URL — that would persist the secret in `.git/config` on
  disk indefinitely.
- After **every single push**, run `cat .git/config` and confirm the
  `[remote "origin"]` URL is still the plain, tokenless
  `https://github.com/ciacob/music_generator_core_ts.git`. This project's
  history has done this after every push so far — keep doing it. If a token
  ever does end up in `.git/config`, treat it as compromised and get it
  rotated immediately.
- Before committing, `git fetch origin` first — this project's history has
  occasionally shown a stale local `origin/main` tracking ref (harmless, just
  re-`fetch` to clear the "ahead of origin" confusion before you commit).

### Local toolchain

```bash
cd ts-translation
npm install
npm run build   # tsc -p tsconfig.json, strict mode -- must be clean before any commit
npm test        # vitest run -- must be all-green before any commit
```

No runtime dependencies (everything ported is self-contained pure logic);
`typescript`, `vitest`, and `@types/node` are the only dev dependencies.
`package.json` now also declares `main`/`types`/`exports` pointing at
`dist/index.js`/`dist/index.d.ts` — the package has a real public entry point
now (see §2).

---

## 2. Project Status: **the AS3 → TypeScript port is complete.**

All 14 steps of the top-level README's "Suggested Translation Order" are
done, committed, and pushed to `main` (latest commit as of this writing:
`dec1b18`). **786 Vitest cases, all passing; `tsc --strict` clean**, verified
from a full `rm -rf dist && npm run build`. A Definition-of-Done review pass
was also completed against the README's own checklist (TSDoc coverage on
every public member, test coverage per package, no leftover AS3 artifacts, no
unused imports, symbol names matching `as-sources/`) — see commit `dec1b18`
for the full writeup. **Licensing remains deliberately unaddressed** (see the
README's own "Licensing" section) — don't publish or share this repo outside
personal/local use until that's resolved.

Everything under `src/` mirrors `as-sources/` file-for-file and
class-for-class (a handful of confirmed-dead AS3 classes were deliberately
not ported — `IClassFactory`, `Objects`, `Piano`, `Time` — each with a
documented reason in `git log`/the relevant file's own doc comment; nothing
was skipped by oversight). `src/index.ts` is the package's public entry
point: an `async generate({ request, onProgress })` wrapper around a private
`MultilineGenerator` instance, plus re-exports of the types/classes needed to
build an `IMusicRequest` and consume the resulting `IMusicalBody`.

**Don't re-derive the full history of design decisions and bug fixes from
scratch — it's all in the git log.** Every commit message is long-form and
explains what changed and why; `git log --oneline` gives you the map, `git
show <hash>` gives you the full story for any one of them. A few things are
worth knowing up front, though, because they'll matter for the work ahead:

### The `percentTime` / `timeSlot` distinction (important for any new code touching settings/context)

Two genuinely different things in this codebase are both, confusingly, named
`percentTime` in the original AS3:

- **`ISettingsList.setValueAt`/`getValueAt`'s own parameter** — a `uint`,
  `[1, 100]` on write, `[0, 100]` on read. Renamed to **`timeSlot`**
  throughout this port specifically to prevent confusion with the next one
  (see commit `6482e5e` for the full audit).
- **`IAnalysisContext.percentTime`** — a genuine `[0, 1)` *ratio*, despite
  its name and despite its own (stale) AS3 doc comment claiming `0`-`100`.
  Left un-renamed (lower-risk than renaming a property already used
  everywhere), but its doc comment now states the true range plainly.

Confusing these two caused several real, found-and-fixed bugs across five
different files (`MetricPlacement`, `VoiceCohesion`, `Harmony`, `Duration`,
and a related-but-distinct case in `ChordProgression`). **If you write new
code that reads `IAnalysisContext.percentTime` and feeds it toward a
`getValueAt`/`setValueAt` call, always convert it explicitly
(`Math.round(analysisContext.percentTime * 100)`) into a locally-named
`timeSlot` variable — never reuse the name `percentTime` for the converted
value, and never pass the raw ratio through unconverted.**

### AS3's `uint`/`int` coercion doesn't carry over — watch for it

AS3 automatically coerces values at typed-parameter/typed-variable
boundaries (e.g. `undefined as uint` silently becomes `0`, not `NaN`).
TypeScript's `as` operator performs no such runtime coercion — it's
compile-time-only. This caused at least one real crash (`ChordProgression`
indexing a bias table out of bounds; AS3 silently treated the result as `0`,
this port's `undefined * biasFactor` became a genuine `NaN` that then failed
downstream validation and threw). **When porting or writing new code that
mirrors an AS3 pattern relying on this coercion, don't assume "AS3 didn't
crash here" means "this TS translation won't either" — trace what the actual
runtime value becomes.**

### Standing conventions worth continuing

- **Injectable `randomFn: () => number = Math.random`** on any class/function
  that needs randomness (`RandomChord`, `RawDuration`, `Harmony`, `Duration`,
  `WeightedRandomPicker`, `Arrays.getRandomItem`/`shuffle`, etc.) — makes
  tests deterministic. Keep doing this for any new randomness introduced in
  the work ahead (e.g. a CLI layer's own use of randomness, if any).
- **Real, found bugs get fixed, not silently reproduced** — but only after
  being flagged clearly and confirmed with the project owner first, with the
  exact mechanism explained (what breaks, why, and what the fix changes).
  Once a *category* of bug has been confirmed and fixed once, later instances
  of the *same, well-understood* category (e.g. a second missing-numeric-
  comparator sort bug) can be fixed directly and just documented, without a
  fresh confirmation round each time — but a *new kind* of finding always
  gets flagged first.
- **Every fix gets a test proving it's real** — ideally one that would have
  caught the bug before the fix (fails against the pre-fix behavior,
  passes after), not just a test that happens to pass now.
- **TSDoc on every public member**, `@see IFoo.member` where a member mirrors
  an already-documented interface, hand-written docs where there's no
  interface to point back to.

### Two small, low-priority, still-open items

- **`DEFAULT_PARAMETER_COLOR`** (in `AbstractGeneratorModule.ts`) is
  `0x4a4a4a`, a generic placeholder — the top-level README's gotcha #5
  worked out the exact formula-derived replacement (`0xC3C1C1`) and this
  port never switched to it. `color` is UI-only metadata, never read by
  generation logic, so this is genuinely low priority — but it's a one-line
  fix if exact visual parity with the original ever matters.
- **Licensing** (see above) — still open.

---

## 3. What's Next

The port itself is done. The project owner's plan for what comes next (not
yet started, no code written for any of it):

1. **Musical-scenario analyzer tests.** More `harmony/analyzers/*` tests that
   exercise realistic musical scenarios (not just synthetic edge cases) and
   assert on expected scores. Likely needs a small hand-written-fixture
   helper — the project owner is considering a text-friendly format (Music
   ABC notation was mentioned) translated into `IMusicUnit`/pitch/duration
   data at test-build time, so fixtures can be written and read as music
   rather than as verbose object literals.
2. **Statistical end-to-end tests.** Beyond `test/integration.test.ts`'s
   structural assertions (unit count, duration, no missing fields), tests
   that generate a reasonably large corpus and check the *distribution* of
   outcomes (pitch range usage, duration variety, score distributions, etc.)
   against expectations. Likely needs its own small helper/harness too.
3. **A CLI layer.** Accepts an `IMusicRequest` as JSON on some input channel,
   runs `generate()`, and emits the resulting `IMusicalBody` as JSON —
   progress updates on `stdout`, errors on `stderr`. Builds directly on
   `src/index.ts`'s existing `generate()`/`GenerationOptions` — the
   `onProgress` callback and thrown-`Error`-on-failure behavior already map
   cleanly onto "write progress to stdout, write errors to stderr".
4. **Standalone-binary packaging.** Make the CLI (or the library directly)
   packable as a single executable — either a third-party packer (e.g.
   `Vercel/pkg`) or Node's own [Single Executable Applications support
   (Node 21+)](https://nodejs.org/api/single-executable-applications.html).
   Needs a real build/packaging script plus automated smoke tests that
   actually run the produced binary, not just the source. Code
   signing/notarization is explicitly out of scope for this step.
5. **An AS3/`NativeProcess` adapter.** So the *original* legacy AS3
   application (which this whole engine was extracted from, and which still
   has a lot of code that will take time to migrate in full) can shell out to
   the packed binary via AS3's `NativeProcess` API and benefit from every fix
   and cleanup this port already did, well before the AS3 app itself is
   fully retired.

None of the above has been started. Whoever picks this up next should treat
each of the five as its own scoped piece of work — probably in roughly the
order listed, since 3 depends on `index.ts` (done), 4 depends on 3, and 5
depends on 4 — and should check in with the project owner before assuming the
above ordering/scope is final, the same way every step of the original port
did.
