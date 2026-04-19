# patch-oc handoff

Maintenance status as of 2026-04-20:

- Part `1` is already included in OpenClaw `2026.4.15`. Keep it only for older
  installs. If older-version support is no longer needed, remove part `1`.
- Part `2` has been fixed by another upstream OpenClaw update path and may stop
  being necessary in future releases. Re-check with `./check.sh --part 2` after
  each OpenClaw update. If newer supported installs no longer need it, remove
  part `2`.
- Part `3` is still uncertain. More runtime testing is needed before deciding
  whether to keep or remove it.

Current practical guidance:

- Do not assume `--part all` is the right default forever. Re-check each part
  against the current OpenClaw build before applying.
- For OpenClaw `2026.4.15`, part `1` is upstreamed and part `2` still needed a
  local patch on the tested install.
