# Current Source Patches

This folder holds source patches that should be applied to an OpenClaw git
checkout with `git am`.

Current patch:

```bash
cd /path/to/openclaw
git am /path/to/patch-oc/current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
```

The Discord lifecycle patch file is a `git am` mailbox that applies the current
three-commit PR series.

The `openclaw-prs/` subfolder also keeps upstream PR notes and handoff state.
