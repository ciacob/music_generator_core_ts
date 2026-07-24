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
AS3 reference source (`as-sources/`) this whole port is translating, and
without it you have no source of truth to translate from or check against.

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
  ability to check new translation decisions against the original AS3 source
  or re-read the top-level README. Keep the zip around, or at least keep
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

### Local toolchain

```bash
cd ts-translation
npm install
npm run build   # tsc -p tsconfig.json, strict mode -- must be clean before any commit
npm test        # vitest run -- must be all-green before any commit
```

No runtime dependencies are needed (everything ported is self-contained pure
logic); only `typescript`, `vitest`, and `@types/node` (added in step 7, once
real Node globals like `setImmediate` started being used) are dev
dependencies.

---

## 2. Project Status

### What's done (steps 1–7 of the README's "Suggested Translation Order")

All of the following is **committed and pushed** to `main`. Full details,
rationale, and every bug found/fixed along the way are in the **git commit
messages** — read those (`git log --oneline`, then `git show <hash>` for any
commit whose message you want the full story on) rather than expecting this
file to re-derive everything. In brief:

1. **`math/`** — `Fraction`/`IFraction`, with pure functions split into
   `fractionMath.ts`.
2. **`utils/`** — `Arrays`, `NumberUtil`, `Strings`, `ColorUtils`,
   `ConstantUtils`, `constants/CommonStrings`. (`Objects` and `Time` were
   **not** ported here — see "Deferred / Debts" below, this was a deliberate
   scope decision, not an oversight.)
3. **`stochastic/random/`** — `WRPickerConfig`, `WeightedRandomPicker`, with
   `weightedRandomMath.ts` pulled out.
4. **`knowledge/`** — `timesignature/` (+ `timeSignatureMath.ts`),
   `harmony/` (`Intervals`, `IntervalRootPositions`), and `instruments/`
   (`IMusicalInstrument`, `AbstractMusicalInstrument`, `MusicalInstrument`,
   `InstrumentFactory` — **`Piano.ts` was ported, then deliberately dropped**
   once confirmed dead code; see below).
5. **`core/interfaces/`** — all 17 contracts that matter (`IClassFactory`
   dropped, confirmed dead — see below).
6. **`generators/constants/`** — all 49 static data tables.
7. **`core/`** concrete classes, `core/abstracts/`, `core/constants/`,
   `core/helpers/` — including the big one, `AbstractGeneratorModule.ts` (the
   generation loop itself).

Current state: **640 Vitest cases, all passing; `tsc --strict` clean.**

### Where implementation departed from the README

- **The generation loop was rearchitected, not ported verbatim** (discussed
  and explicitly agreed with the project owner before writing it — see the
  `AbstractGeneratorModule.ts` file header and its commit message for the
  full reasoning). The AS3 original used a Timer-based, callback-driven
  pseudo-thread (`_executeAsyncWhile` with `next()`/`exit()` closures) to
  keep Flash's single UI thread responsive. This port instead uses a real
  `async`/`await` function, yielding via `setImmediate` (falling back to
  `setTimeout(fn, 0)`) between iterations — gotcha #3 in the README gestures
  at this option but the actual implementation required real design work
  beyond what the README specifies. **`IGeneratorModule.generate()`'s
  signature was changed from `void` to `Promise<void>`** to reflect this —
  a deliberate interface change, not a bug fix.
- **`IClassFactory` was dropped entirely**, not just ported-and-flagged. The
  README already suspected it was dead ("looks dead... confirm it's
  genuinely unused"); this port did that confirmation (`grep` across all 133
  source files found zero references outside its own declaration) and, once
  confirmed, removed it rather than carrying a confirmed-dead interface
  forward. Also: TypeScript interfaces are fully erased at compile time and
  have no runtime "Class" representation the way AS3 interfaces do, so even
  a faithful port of its `Interface : Class` parameter would have been an
  approximation at best — one less reason to keep it.
- **`Piano.ts` was ported in full, then deleted** after the project owner
  confirmed (recalling their own original AS3 development) that it was
  abandoned in favor of the generic `InstrumentFactory` approach and is
  genuinely dead code (confirmed via `grep`: nothing anywhere in the 133-file
  snapshot references the `Piano` class itself, only the string `"Piano"` as
  a `PartNames` value).
- **Several array-like containers** (`TimeSignatureMap`, `MusicalBody`,
  `ParametersList`) got a `Map`/plain-array-with-typed-methods redesign
  instead of AS3's `Dictionary`+uid+index triple or raw `Vector`, per the
  README's own gotcha #1 guidance — but the specific shape (which methods,
  which callback signatures) required judgment calls the README doesn't
  spell out.
- **`CommonMusicUtils.getChordDetails`** returns a properly-typed
  `ChordDetails` interface instead of AS3's dynamic string-keyed `Object` bag
  (the AS3 original only used that shape because AS3 lacks a convenient
  anonymous-record return type).
- Several functions gained an **injectable `randomFn: () => number =
  Math.random` parameter** that the AS3 original didn't have as a seam
  (`WeightedRandomPicker`, `Arrays.getRandomItem`/`shuffle`,
  `CommonMusicUtils.findSuitablePitch`). This isn't explicitly mandated by
  the README but was adopted as a standing project convention (see gotcha
  #11, which flags the *need* without prescribing the *mechanism*) — **keep
  doing this** for any new randomness introduced in `harmony/sources/` and
  `harmony/traits/` (`RandomChord`, `Harmony`'s/`Duration`'s hazard-based
  picking), since deterministic tests are hard to write otherwise.
- **`DEFAULT_PARAMETER_COLOR`** (the placeholder for the AS3 original's
  missing `Colors.CHROME_COLOR_DARKER`) is currently `0x4a4a4a` — a generic
  placeholder. **The README's gotcha #5 already worked out the exact
  formula-derived replacement value (`0xC3C1C1`)** and this port didn't use
  it. See "Deferred / Debts" below — this is worth reconciling.

### Gotchas found during development that the README does *not* mention

The README's own gotcha table is good but incomplete — these were discovered
the hard way (some by the test suite catching them, not just by inspection):

1. **Circular-import evaluation-order trap.** If module A's top-level code
   reads a constant from module B, and module B's top-level code reads a
   constant from module A (even if only one direction is "real" and the
   other is a function body that only runs later), **whichever module gets
   imported *first* by an outside consumer determines whether this blows up
   at runtime**, because ES module imports are hoisted and resolved
   depth-first before the importing module's own top-level code runs. Found
   for real between `PartNames.ts` and `PartFamilies.ts` (fixed by extracting
   the ordering functions that needed both into a third file,
   `PartOrdering.ts`, so the graph became acyclic) and reasoned through (and
   avoided) for `Intervals.ts`/`IntervalRegistryEntry.ts` using a structural
   interface instead of a concrete-class type. **When two files in
   `knowledge/`/`generators/constants/` reference each other, check which one
   would be entered first in realistic usage, or just avoid the cycle
   structurally from the start.**
2. **TS strict-mode narrowing doesn't always follow you through a lazy-init
   pattern.** `let x = cache.get(key); if (x === undefined) { x = compute();
   cache.set(key, x); } return x;` can still fail to narrow `x` to non-
   `undefined` at the `return` in some cases (observed with `Map.get()`
   results and with class-field lazy caches). The reliable fix is an early
   return: `if (cache.has(key)) return cache.get(key)!;` style, or
   initializing a `let result: T = DEFAULT_VALUE;` up front and only ever
   reassigning it (never leaving a branch where it could still be
   `T | undefined`).
3. **The exact same `.splice(start, count, arrayOfItems)` bug (passing the
   rest-args array as a single third argument instead of spreading it) was
   found twice independently** in the original AS3 (`TimeSignatureMap`,
   step 4; `ParametersList`, step 7) — both are real bugs, both fixed with
   `...items`. **If you find a third array-like container with a `splice`
   method while porting `harmony/`, check it for the same pattern.**
4. **`MusicalBody.updateDuration()`** called a mutating method on a field
   that's only lazily initialized elsewhere in the class — reachable via the
   public `set length` setter on a body that never had a unit added, and
   would have crashed. Fixed with the same lazy-init guard the class's own
   add/remove-duration helpers already used.
5. **`AbstractGeneratorModule.parametersList` re-added its 4 default
   parameters on every single read**, not just the first — and it's read
   repeatedly during one generation run (once per trait per music unit, at
   minimum). This is a real, severe bug in the original (unbounded parameter
   list growth during any actual run), not a hypothetical one — found by
   reading the code carefully, not by a test catching it. **Fixed.** If any
   other lazily-initialized getter elsewhere in `harmony/` follows the same
   "lazy-create, then unconditionally mutate" shape, check it for the same
   bug before assuming it's fine.
6. **`IPerformanceInstruction.as`'s setter for `value` is invalid
   ActionScript** (`function set (value : Object) : void;` — missing the
   property name between `set` and `(`). It could only ever have been
   unexercised reference source. Reconstructed as `set value(...)`, matching
   the getter and the file's own naming pattern.
7. **TypeScript's `abstract` keyword doesn't allow a concrete subclass to
   simply omit an abstract member the way AS3's runtime-checked
   `_yeldAbstractClassError()` simulation did.** In AS3, `Piano.as` never
   overrode `ordinalIndex` or the `stavesNumber` setter, and that was fine —
   the class still constructed, it just threw if you touched those specific
   members. In TS, a class with any unimplemented abstract member is *itself*
   still abstract and can't be `new`'d at all. Where this came up (`Piano`,
   since removed) the fix was implementing the member as an explicit `throw`,
   preserving "constructs fine, throws only if touched" rather than
   inventing a value the original never specified. **Keep this pattern in
   mind** if any `harmony/` class turns out to have a similarly incomplete
   AS3 original.
8. **Relative import path-depth mistakes are an easy, recurring, entirely
   self-inflicted bug.** Every time a new file goes one directory level
   deeper or shallower than its neighbors (e.g. `src/core/*.ts` vs.
   `src/core/abstracts/*.ts` vs. `src/core/interfaces/*.ts`), it's very easy
   to copy-paste an import block from a sibling at the wrong depth and get a
   `../../` count that's off by one — `tsc` catches this immediately
   (`Cannot find module`), but it happened repeatedly across this project.
   **Double-check the actual directory depth before writing imports in a
   new file, don't just pattern-match a neighboring file.**
9. **`@types/node` had to be added as a dev dependency** once
   `AbstractGeneratorModule.ts` needed `setImmediate` — the original
   `tsconfig.json`/`package.json` from the README's "Bootstrapping" section
   assumed no Node-specific globals would ever be needed, which held true
   until step 7's async rearchitecture.
10. **Missing external dependencies show up mid-port, not just up front.**
    `AbstractGeneratorModule.as`'s `Colors.CHROME_COLOR_DARKER` (from
    `eu.stochastic.engine.legacy.Colors`) isn't in `as-sources/` at all —
    a different situation from gotcha #4/#7's "Flash-only API, just drop it"
    cases, since this is a *missing reference*, not an excludable API. The
    README actually anticipated this exact one (gotcha #5) with a worked-out
    replacement value — but it's easy to miss that a "gotcha" entry contains
    an actionable exact number to use, rather than just a general strategy.
    **Re-read the gotchas table once you're actually at the file it applies
    to, not just once at the start.**

### Deferred / Debts

- **`utils/Objects.ts` is not yet ported.** It's needed by
  `harmony/sources/RandomChord.as` (step 9), confirmed via `grep` across
  `as-sources/` — port it when you get there, not before (nothing currently
  ported needs it).
- **`utils/Time.ts` is not ported, and per the current design, never needs
  to be.** It was only ever used by `AbstractGeneratorModule.as`'s
  Timer-based pacing mechanism, which this port replaced entirely with
  `async`/`await` + `setImmediate` (see above). If a future file turns out to
  need `Time.as` for some *other* reason, port it fresh at that point — don't
  assume this note still applies without checking.
- **`DEFAULT_PARAMETER_COLOR` (`0x4a4a4a`, in `AbstractGeneratorModule.ts`)
  should probably be reconciled with the README's gotcha #5 worked-out value
  (`0xC3C1C1`)** if exact visual parity with the original ever matters (it's
  UI-only, never read by generation logic, so this is low priority — but it's
  a one-line fix and the README already did the math).
- **Licensing is still unresolved**, exactly as the top-level README's own
  "Licensing" section describes — no per-subfolder `LICENSE` files were ever
  copied into `as-sources/`, and this hasn't changed. Don't publish or share
  this repo outside personal/local use until that's addressed.
- **No integration test yet against the README's "Minimal Fixture"** — that's
  step 14 territory, still several steps away.
- Two commits (`75787b6`, then `e54b288`) represent a **deliberate mid-step
  checkpoint**: step 7 was committed once with everything *except*
  `AbstractGeneratorModule.ts`, specifically so that large, tricky piece
  could be tackled (and reviewed) on its own. If you're continuing a
  similarly large step, consider doing the same — check with the project
  owner first, they've been receptive to it.

---

## 3. How To Actually Onboard — Step by Step

1. **Confirm the original zip exists and you have it.** If not, stop and ask
   the project owner for it — don't attempt to reconstruct `as-sources/` or
   the top-level `README.md` from anything in the git repo; they were never
   committed there.
2. **Unzip it locally.** You should end up with `music-generation-engine-ts/`
   containing `README.md`, `as-sources/`, and an empty `ts-translation/`.
3. **Clone the repo into the (empty) `ts-translation/` folder:**
   ```bash
   cd music-generation-engine-ts/ts-translation
   git clone https://github.com/ciacob/music_generator_core_ts.git .
   ```
4. **Set the git identity locally**, scoped to this repo:
   ```bash
   git config user.name "Claudius Iacob"
   git config user.email "claudius.iacob@gmail.com"
   ```
5. **Ask the project owner for a current PAT.** Don't reuse one from old
   scrollback/history. Verify it with a read-only `git ls-remote` (see
   section 1 above for the exact command) before you have anything real to
   push. When you do push for real, always follow up with `cat .git/config`
   to confirm the token didn't get persisted anywhere.
6. **Read the top-level `README.md` in full** (`music-generation-engine-ts/
   README.md`, one level up from the repo you just cloned). It has the
   package map, the full gotchas table, the suggested project layout, the
   suggested translation order, the licensing caveat, and the "Definition of
   Done" checklist per step. This ONBOARDING.md file supplements it with
   what's happened *since* that README was written — it doesn't replace it.
7. **Run the toolchain once to confirm the environment works** before
   changing anything:
   ```bash
   npm install
   npm run build
   npm test
   ```
   You should see a clean `tsc` run and 640 passing Vitest cases (this
   number will grow — check the actual current count against `git log`/the
   test output, don't assume this file stays perfectly in sync).
8. **Confirm next steps with the project owner** before diving in. The
   README's suggested order has step 8 (`harmony/constants/`) up next, but
   given how much judgment each step has required so far (bug fixes,
   redesigns, dropped-dead-code calls), don't assume you should just plow
   ahead alone — check in, especially before any step that (like step 7's
   `AbstractGeneratorModule`) looks like it might need a design discussion
   first.
