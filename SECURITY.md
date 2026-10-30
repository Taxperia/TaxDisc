# Security Policy

## Supported versions

Security fixes target the latest released TaxDisc 1.2.x version. Older local Radix builds and development previews are not maintained release channels. Use the latest release and retain the provided checksum file when verifying downloads.

## Report a vulnerability privately

Use [GitHub private vulnerability reporting](https://github.com/Taxperia/TaxDisc/security/advisories/new) when it is available for this repository. If the private form is unavailable, open a minimal issue requesting a private security contact **without** publishing exploit details, private paths, files, credentials, or personal data.

Include the affected version, Windows version, required attacker access, the expected security boundary, and the smallest safe reproduction using disposable data. Explain what unauthorized action or disclosure occurs. Do not test against another person's machine or files. Maintainer response is best-effort; there is no guaranteed response SLA or paid bounty program.

## Security model

- TaxDisc runs with the current user's filesystem permissions and does not require administrator privileges.
- The renderer is sandboxed and context-isolated, with Node integration disabled. A fixed preload bridge binds privileged calls to the maintained local main-frame pages.
- Popups, webviews, unexpected page navigation, renderer permissions, and renderer HTTP/WebSocket requests are denied. Pages use `script-src 'self'` without inline JavaScript.
- Opening or revealing a path is an explicit user action and checks both lexical and canonical containment within the current scan root.
- Normal scans read filesystem metadata, not file contents. No scan import endpoint, remote account, analytics, automatic file deletion, or remote updater is implemented.
- Names and paths are escaped when rendered. CSV cells are quoted and formula-like prefixes are neutralized.
- Profile JSON is bounded and structurally validated. Review records are bound to a unique scan identity, and successful saves use temporary-file rename.

## Limits and deployment facts

A scan of a changing filesystem is best-effort, not an atomic snapshot. Type and canonical-path checks reduce accidental junction traversal; they do not make all Windows check/use races atomic. Do not treat a scan root as a security sandbox or run the app elevated to analyze a hostile, concurrently modified tree.

Same-user applications can normally access the same Windows profile and launch environment. TaxDisc does not claim isolation from malware already running with the user's authority. OS ACLs and a trusted operating system remain prerequisites.

Possible duplicates use name and size only. Temporary-file categories are review hints. Neither feature authorizes safe deletion, and TaxDisc does not delete analyzed files.

Release checksums and build manifests establish consistency and integrity, not publisher identity. Unless stated otherwise, builds are unsigned. Publisher signing, clean Windows installation/upgrade/uninstallation, and hostile-filesystem behavior need their own environment-specific validation.

The source review for 1.2.0 identified robustness bugs and defense-in-depth improvements. A formal sandbox-qualified exploit audit was not completed: this Windows environment lacked the audit validator's no-follow/nonblocking input protection and required isolated execution/evidence-promotion controls. Ordinary development regressions and CI results must not be represented as a complete security audit.

## Dependency and workflow maintenance

Run `npm audit` and review dependency updates regularly. A zero-advisory result is a point-in-time database result, not a security guarantee. CI actions are pinned to immutable commits; pull requests do not receive release-write permissions or signing secrets. Releases must pass tests and artifact/source consistency checks before publication.
