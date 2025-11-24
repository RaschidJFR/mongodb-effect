<!--
Guidance for AI coding agents working on this repository.
Keep this short, actionable, and specific to this codebase.
-->

# Copilot Instructions — Effect CLI Template

- **Project purpose:** A minimal CLI application built with Effect and TypeScript. The runtime entry is `src/bin.ts` and the CLI behavior is defined in `src/Cli.ts` using `@effect/cli`.
- **Package manager / tooling:** This repo uses `pnpm` (see `package.json`). Builds use `tsup`, runtime helpers use `tsx` for running TS directly, and tests use `vitest` (`@effect/vitest`).

## Quick commands

- Install: `pnpm install`
- Run CLI in development (via tsx): `pnpm tsx src/bin.ts [args]`
- Build: `pnpm build` (runs `tsup` and `scripts/copy-package-json.ts`)
- Test: `pnpm test` (runs `vitest run`)
- Typecheck: `pnpm check` (runs `tsc -b tsconfig.json`)

## Important conventions and patterns

- ESM + TypeScript: `package.json` sets `type: "module"`. Source files import runtime artifacts with `.js` extensions (for example `import { run } from "./Cli.js"` in `src/bin.ts`). Keep the `.js` import paths in TypeScript source — they are intentional and required for correct resolution after build or when running with `tsx`.
- Runtime wiring: `src/bin.ts` composes `NodeContext.layer` and runs the program with `NodeRuntime.runMain`. Avoid changing the top-level runtime wiring unless you understand Effect layers and `runMain` semantics.
- CLI shape: `src/Cli.ts` uses `@effect/cli/Command` and exports `run`. Follow that pattern for new commands (make a `Command.make("name")` and `Command.run(command, { name, version })`).
- Tests: Use `@effect/vitest` helpers. The existing test `test/Dummy.test.ts` demonstrates the test runner import style.

## Files to inspect when changing behavior

- `src/bin.ts` — entrypoint, runtime provisioning, and Node runtime behavior.
- `src/Cli.ts` — CLI command definitions and how they expose `run`.
- `package.json` — scripts and devDependencies (pnpm-specific). Note the `copy-package-json` helper in `scripts/` used during `pnpm build`.
- `tsup.config.ts`, `tsconfig.*.json` — build and compiler settings (ESM, output directory `dist`, etc.).

## Build / dev gotchas for AI agents

- When running files directly during development use `pnpm tsx src/bin.ts` so Node/Esm resolution matches the repo conventions. Running compiled output requires `pnpm build` first; the final `dist` artifacts are intended for publishing.
- Do not remove `.js` extensions from imports in source files; leaving them ensures code runs with both `tsx` and Node ESM after bundling.
- `pnpm build` executes `tsx scripts/copy-package-json.ts` afterwards — if you modify package metadata, consider updating this script or its inputs.

## Code style hints (what to follow)

- Prefer small, single-responsibility commands under `@effect/cli` style.
- Use Effect primitives for side effects and to provide contexts/layers (see `Effect.provide(NodeContext.layer)` usage).
- Keep top-level files thin: business logic should live in separate modules; `src/bin.ts` should remain mainly runtime bootstrap.

## When adding features

- Add new commands by creating new modules that export a `run` compatible with `src/bin.ts` usage, and import them in `src/Cli.ts` or wire them into the existing `Command` tree.
- Add tests under `test/` using `@effect/vitest` conventions and run `pnpm test` locally.

## If unsure / missing info

- Ask the maintainers for expected Node version and publishing workflow before changing `package.json` or `publishConfig`.
- If a change touches build outputs or `tsup.config.ts`, run `pnpm build` and `pnpm test` to validate.

---

Please review these notes and tell me if you want more details (examples, common refactors, or CI guidance).
