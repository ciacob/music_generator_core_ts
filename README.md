# music-generation-engine (TypeScript port)

Node.js / TypeScript port of the ActionScript 3 stochastic music generation
engine, translated package by package from the original AS3 reference
snapshot.

See the top-level `README.md` in the parent `music-generation-engine-ts/`
folder (sibling `as-sources/` directory) for:

- the full package map (which original library each part came from),
- the AS3 → TypeScript translation gotchas table,
- the suggested translation order and project layout,
- the minimal fixture / first integration-test target,
- licensing notes (still unresolved — see that document before publishing).

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
