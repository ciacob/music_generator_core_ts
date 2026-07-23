# music-generation-engine (TypeScript port)

Node.js / TypeScript port of the ActionScript 3 stochastic music generation
engine. This package is being built incrementally, translating one source
package at a time from the original AS3 reference snapshot.

See the top-level `README.md` in the parent `music-generation-engine-ts/`
folder (sibling `as-sources/` directory) for:

- the full package map (which original library each part came from),
- the AS3 → TypeScript translation gotchas table,
- the suggested translation order and project layout,
- the minimal fixture / first integration-test target,
- licensing notes (unresolved as of this scaffold — see that document before
  publishing).

## Status

Scaffold only — `src/` mirrors the suggested layout with placeholder
directories; no classes have been translated yet.

## Scripts

- `npm run build` — compile with `tsc`
- `npm test` — run the Vitest suite once
- `npm run test:watch` — run Vitest in watch mode
