---
description: Upgrade pinned Deno version across this repository
argument-hint: <version>
---

Upgrade this repository to Deno version `$ARGUMENTS`.

Requirements:
- Treat `$ARGUMENTS` as the target Deno version.
- Search the repository for explicit Deno version pins before editing.
- Update only files that explicitly pin a Deno version, especially:
  - `.tool-versions`
  - `.devcontainer/devcontainer.json`
  - `.github/workflows/*.yml`
  - `.github/workflows/*.yaml`
  - other toolchain files such as `.mise.toml` or Docker/devcontainer files if they contain an explicit Deno version
- For GitHub Actions that use `denoland/setup-deno@v2`, update `with.deno-version` only if the workflow already pins a concrete Deno version. If the workflow is unpinned, leave it unchanged unless I explicitly ask to pin CI too.
- Do not change unrelated dependency versions.

Execution steps:
1. Find every explicit Deno version reference in the repo.
2. Update the pinned version values to `$ARGUMENTS`.
3. Re-scan the repo to confirm the old Deno version is gone from project files you intentionally changed.
4. Report which files were changed and whether CI is still unpinned.

Keep the response concise and use file references with line numbers when summarizing the result.
