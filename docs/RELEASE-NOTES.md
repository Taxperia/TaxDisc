# TaxDisc 1.2.0

TaxDisc brings the former local Radix project to a public Windows release with English and Turkish UI support.

## Added

- Persistent English/Turkish language selection, localized dates and numbers, and localized native scan dialogs.
- Trusted-main-frame IPC authorization, an explicit page allowlist, consistent strict script CSP, and renderer network/permission denial.
- Bounded, structurally validated saved data and unique scan identities for review-list binding.
- Read-only pull-request validation, pinned CI actions, and trusted-branch Windows release automation.
- English README, contribution guide, code of conduct, MIT license notices, and security policy.

## Fixed

- Rapid bar-chart redraw callbacks could access or overwrite a newer render.
- Clearing saved data could race a new scan or review write. Partial cleanup could leave cached and persisted state inconsistent.
- Browser preview scans omitted indexes used by large-file, duplicate, and temporary-file pages and did not flag depth truncation correctly.
- Stale entry type information could cause a replaced filesystem link to be followed. Traversal now rechecks current type and canonical containment; filesystem races remain best-effort.
- A new unpacked build could incorrectly pass release verification with old same-version EXEs. Distribution hashes are now bound to their build's ASAR, and packaged smoke tests check the actual runtime archive.
- Long lists and small-window navigation remain accessible. File names matching UI terms are preserved during language changes.

## Behavior and limits

TaxDisc does not delete files. Duplicates are candidates based on name and size, and temporary-file labels are review hints. Logical file size may differ from allocated or recoverable space. Only the latest scan is retained.

Builds are unsigned unless explicitly stated otherwise. Checksums and build manifests do not replace publisher signatures. Clean-system installer/upgrade/uninstall validation and adversarial filesystem testing are separate checks; see SECURITY.md for review limits.
