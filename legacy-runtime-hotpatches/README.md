# Legacy Runtime Hotpatches

This folder holds the old Deno runtime patch CLI for installed OpenClaw `dist/`
bundles. These patches are deprecated compatibility tools for older installs,
not the default recommendation for current OpenClaw.

Check first:

```bash
./check.sh --part <1|2|3>
```

Apply only a verified needed patch:

```bash
./apply.sh --part <1|2|3>
```

Development checks:

```bash
deno fmt
deno lint
deno task check
deno test --allow-read="$PWD,${TMPDIR:-/tmp}" --allow-write="${TMPDIR:-/tmp}"
```
