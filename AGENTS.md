# Repository Guidelines

## Project Structure & Module Organization
- Core tooling lives in `flake.nix`; it defines the Codex CLI binary, helper scripts, and the development shell. Treat this as the single source of truth for dependencies.
- `.envrc` and `.direnv/` seed environment variables; update them if your change requires additional secrets or paths.
- Place new source modules under `src/` and group related utilities by feature. Add corresponding assets (mock screens, prompts, etc.) under `screens/` to keep design inputs discoverable.
- Keep experimental scripts inside `tools/` with a short README so future agents can reuse them.

## Build, Test, and Development Commands
- `nix develop` — open the fully-provisioned shell with Codex, Node.js 22, git, ripgrep, and helper scripts.
- `codex --help` — verify the Codex CLI is available and review supported subcommands.
- `codex-sketch ./screens -- "Refactor per sketch"` — example workflow for attaching reference imagery to a prompt; adjust the path and prompt to match your task.
- `workspace-repo-init new-project` — scaffold `~/workspace/new-project`, run `git init` if needed, and whitelist it inside `~/workspace/.gitignore`.

## Coding Style & Naming Conventions
- Prefer TypeScript or modern JavaScript for new tooling; use 2-space indentation and ES module syntax.
- Name files by feature (`feature-name.ts`) and functions with descriptive verbs (`buildAgentPrompt`).
- Run `node --check file.ts` or `tsc --noEmit` (if a `tsconfig.json` exists) before submitting substantial changes.

## Testing Guidelines
- No automated tests exist yet; when adding behavior, provide a minimal `tests/` module and runnable script (`npm test` or `bun test`) so it can be wired into the flake later.
- Favor scenario-based tests that mirror Codex prompt flows; document absorbed fixtures in `tests/README.md`.

## Commit & Pull Request Guidelines
- The repository has no commit history yet, so start with imperative subjects (`Add codex sketch helper`) and concise bodies that explain motivation and outcome.
- Reference related issues in the commit body or PR description (`Refs #12`), and attach screenshots or prompt transcripts when changes depend on visual context.
- Ensure PR descriptions outline: purpose, how to reproduce, testing performed, and any follow-up tasks for other agents.
