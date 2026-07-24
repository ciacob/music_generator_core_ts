# music-generation-engine (TypeScript port)

Node.js / TypeScript port of the ActionScript 3 stochastic music generation
engine, translated package by package from the original AS3 reference
snapshot.

The full package map, AS3 → TypeScript translation notes, and licensing
status live in a top-level `README.md` that is **not part of this
repository** — it's reference material handed off directly between whoever
works on this project, not published here. See `ONBOARDING.md` in this repo
for what that document is and how to get it if you don't already have it.

## Status

The AS3 → TypeScript port is complete — all translation steps done, full
test suite passing, `tsc --strict` clean. For the current state, what's
next, and everything worth knowing before touching this codebase, see
`ONBOARDING.md` in this repo. For the full history of decisions, fixes, and
rationale behind them, see `git log` (commit messages are long-form and
detailed, one per meaningful change).

## Scripts

- `npm run build` — compile with `tsc`
- `npm test` — run the Vitest suite once
- `npm run test:watch` — run Vitest in watch mode
