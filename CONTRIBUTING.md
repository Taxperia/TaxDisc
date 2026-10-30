# Contributing to TaxDisc

Bug reports, focused fixes, accessibility improvements, and English/Turkish translation corrections are welcome. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues through [SECURITY.md](SECURITY.md), not a public exploit report.

## Local setup

Use Windows and Node.js 22.12+ (preferably Node 24 LTS).

```powershell
npm ci
npm run lint
npm test
npm run smoke
```

Tests create disposable fixture directories and isolated application profiles. They must never modify a contributor's actual scanned files or normal application profile. Avoid running the application as administrator.

## Pull requests

1. Describe the user-visible problem and expected behavior.
2. Keep changes focused; add a meaningful regression for a fixed bug.
3. Run lint, unit tests, and applicable Electron flows.
4. Explain validation limits, particularly Windows versions, installer behavior, large drives, and network shares.
5. Keep generated EXEs, `node_modules`, scan records, screenshots containing private paths, credentials, signing files, and local environments out of commits.

Authored UI copy is translated through `js/i18n.js`. Dynamic filenames and paths must remain literal: never translate a completed DOM tree or arbitrary dataset strings. Verify both English and Turkish after changing UI copy.

Privileged operations belong in the Electron main process, behind the trusted-sender guard. Expose narrowly scoped preload methods. Do not add arbitrary IPC, shell-command evaluation, remote content, inline scripts, telemetry, or deletion behavior as an incidental change.

## Project layout

| Path | Purpose |
| --- | --- |
| `electron/` | Main process, preload, worker scanner, state and bridge policy |
| `js/`, `css/`, `*.html` | UI, localization, charts, shared CSV and indexing logic |
| `test/` | Synthetic-data unit and Electron regression tests |
| `scripts/` | Syntax checks, icon generation, benchmark and release verification |
| `.github/workflows/` | Windows validation and trusted-branch publication |

## Release changes

Update `package.json`, `package-lock.json`, and `docs/RELEASE-NOTES.md` together. A published version is immutable; bump the version for new release content. Build with `npm run dist`, test the actual packaged executables, and run `npm run verify:release`. Never claim that hashes validate an Authenticode identity or that an application smoke test validates installer removal.

Contributions are provided under the project's [MIT License](LICENSE).
