<p align="center"><img src="assets/icon.png" width="88" alt="TaxDisc icon"></p>

# TaxDisc

**See what is taking up space on your Windows drive.**

TaxDisc is a local-first disk analyzer with an interactive treemap, large-file filters, possible duplicate detection, and a persistent review list. It runs without an account and keeps scan data on your computer.

[![Windows CI](https://github.com/Taxperia/TaxDisc/actions/workflows/windows.yml/badge.svg)](https://github.com/Taxperia/TaxDisc/actions/workflows/windows.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Windows x64](https://img.shields.io/badge/platform-Windows%20x64-0078D4)
![Languages](https://img.shields.io/badge/languages-English%20%2F%20Türkçe-238636)

[Download](https://github.com/Taxperia/TaxDisc/releases/latest) · [Report a bug](https://github.com/Taxperia/TaxDisc/issues/new?template=bug_report.yml) · [Security policy](SECURITY.md) · [Contributing](CONTRIBUTING.md)

## Install

Download the Windows 64-bit build from [Releases](https://github.com/Taxperia/TaxDisc/releases):

| Package | Use |
| --- | --- |
| `TaxDisc-1.2.0-x64-setup.exe` | English/Turkish installation wizard and shortcuts |
| `TaxDisc-1.2.0-x64-portable.exe` | Run without installing |
| `SHA256SUMS.txt` | SHA-256 checksums for the downloaded executables |

The current distribution is **unsigned** unless the release explicitly states otherwise. A checksum verifies file integrity; it does not authenticate the publisher. Target platforms are Windows 10/11 x64. Windows tests run in CI; an automated application test is not the same as a clean-system installer, upgrade, and uninstall certification.

## Get started

1. Open TaxDisc and choose **Scan Folder**.
2. Select a folder or drive. The scan runs in a background worker and can be cancelled.
3. Double-click a folder in the map to explore it, or filter the large-file list.
4. Add items to the **Review List** to inspect in Explorer or export as CSV.
5. Use **Language / Dil** at the bottom of the sidebar to switch between English and Turkish. Your choice and review list survive page changes and restarts.

**TaxDisc does not delete your files.** Adding an item to the Review List does not reclaim disk space.

## Features

- **Disk Map:** interactive treemap, breadcrumbs, sorting, search, and folder navigation.
- **Large Files:** files of 10 MB or more, filtered by size, type, name, or path.
- **Possible Duplicates:** same-name, same-size candidates of 1 MB or more. Contents are not compared; candidates are not proof of identical files.
- **Temporary Files:** cache, log, and development-output candidates based on recognized folder components and extensions. A classification is not a guarantee that deletion is safe.
- **Review List:** saved selections, search, Explorer actions, removal from the list, and CSV export. Parent folders and their children are not counted twice.
- **Reports:** folder sizes, file-type distribution, drive usage, printing, and UTF-8 CSV export.
- **English and Turkish:** localized labels, dates, numbers, and native scan dialogs. Filesystem names and paths are never translated.

## Privacy and behavior

No analytics, account service, or remote scan upload is implemented. Renderer HTTP/WebSocket requests are blocked. Opening a file explicitly hands it to its default application, which has its own behavior. Scanning a network share uses the operating system's filesystem connection to that share.

The latest scan and review list are saved under `%APPDATA%\taxdisc`. The portable build also uses this profile directory. **Clear Saved Scan** removes application records, not the analyzed files; a cleanup warning is shown if profile files cannot be removed.

A successful new scan resets the previous review list. Cancellation or a failed save keeps the previous completed scan. Only the latest scan is stored; historical growth is not calculated. Earlier local Radix builds used a different profile name; TaxDisc does not silently import or remove that profile.

### Important limits

- Sizes are **logical file sizes**. Sparse files, compression, and hard links can make allocated disk usage or recoverable space differ. Hard-linked paths are counted separately.
- Files below 10 MB and folders below 1 MB are grouped into **Other small items** in the map. Totals and counts include these items; aggregates are not real file paths.
- Symbolic links and Windows junctions are skipped. Traversal rechecks current entry types and canonical containment, but a live filesystem scan is not an atomic snapshot or an access-control sandbox against concurrent replacement.
- Inaccessible entries and scan limits produce warnings. The desktop depth limit is 80; there is no default file-count cap. Very large scans remain limited by available memory and disk space.
- Saved scan JSON is bounded to 128 MiB, review JSON to 16 MiB, and the review list to 50,000 entries. Invalid records recover to a rescan state.
- Browser HTML is a development preview. The supported end-user product is the Windows desktop application.

## Build from source

Requirements: Windows, Node.js 22.12+ (Node 24 LTS recommended), and npm. Direct tooling versions and transitive dependencies are locked.

```powershell
git clone https://github.com/Taxperia/TaxDisc.git
cd TaxDisc
npm ci
npm start
```

`npm ci` installs the pinned Electron runtime from its official distribution. No system-wide software installation is required for the application itself.

```powershell
npm run lint          # JavaScript syntax and local script/CSP checks
npm test              # Filesystem, state, CSV, bridge, localization, and redraw regressions
npm run smoke         # Real Electron flows with isolated synthetic profiles
npm run benchmark     # Generate and scan 20,000 disposable files
npm run dist          # Build setup and portable Windows x64 packages
npm run verify:release
```

The smoke test covers all six pages, English/Turkish switching, literal file names, scan cancellation, persistence, CSV downloads, and minimum-window accessibility. Set `TAXDISC_EXECUTABLE` to test a packaged EXE; the test compares its actual ASAR digest and runtime version with the expected build.

The build manifest binds executable hashes to the source-matched ASAR from the same distribution build. Verification rejects stale same-version executables. This is build-consistency verification, not an Authenticode signature or a clean-system installer test.

## Development and releases

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and the [1.2.0 release notes](docs/RELEASE-NOTES.md). Windows CI validates pull requests with read-only repository permissions. Publication runs only from the trusted `main` branch in this repository after validation; versioned release assets are not silently overwritten.

Security improvements are documented in [SECURITY.md](SECURITY.md). No claim of a complete penetration test or absence of all vulnerabilities is made.

## License

[MIT](LICENSE). Original Radix copyright is retained; TaxDisc is maintained by [Taxperia](https://github.com/Taxperia).
