---
name: slew-share
description: Publish an HTML plan, report, mockup, or any static page to a temporary public URL via `slew share`. Use whenever the user asks to "share this plan", "give me a link", "publish this HTML", "make this viewable", "put this on a temporary URL", or when you have generated an HTML plan/report/prototype the user should view in a browser. Also for sharing a built static directory temporarily. The URL expires automatically (default 7 days).
---

# slew-share — temporary deploys for generated pages

Slew (slew.sh) serves throwaway static pages on memorable three-word URLs
like `https://quiet-harbor-lantern.slew.cloud`
that expire and clean themselves up. Perfect for HTML plans, reports, mockups,
and one-off previews an agent generates.

## Publish

```sh
slew share <file.html>              # single page, served at /
slew share <directory>              # a whole static build
slew share <file.html> --ttl 3      # expire after 3 days (1-30, default 7)
slew share <file.html> --password "correct horse"   # gate it behind a password
```

The command prints the URL and expiry. Give the user the URL as a clickable
link and mention when it expires.

Use `--password` (4–128 chars) when the content is sensitive — a client
preview, an internal plan. Visitors get a slew unlock screen and stay in for
12 hours; tell the user the password travels separately from the URL, and
never print it into logs or the page itself.

## Authoring the page

Write a self-contained HTML file (inline CSS, no build step). Dark, readable,
mobile-friendly. Name it after the content (`refactor-plan.html`), then share
it — the file is served as `index.html` at the share URL regardless of name.

## Housekeeping

```sh
slew shares                         # list live shares with expiry
```

Shares expire on their own; there is nothing to clean up manually.

## Requirements and troubleshooting

- Needs the `slew` CLI (installed from the slew-cli repo: `pnpm install &&
  pnpm build && npm install -g .`) and a login (`slew login`, GitHub device
  flow). In CI, set `SLEW_TOKEN` instead.
- `Invalid or revoked token` usually means a stale `SLEW_TOKEN` env var is
  overriding the stored login — `unset SLEW_TOKEN` and retry.
- The API is `https://api.slew.cloud`; override with `SLEW_API_URL` for a
  local stack.
