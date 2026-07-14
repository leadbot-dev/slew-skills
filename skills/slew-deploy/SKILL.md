---
name: slew-deploy
description: Deploy the current project to Slew (slew.cloud) — an EU-native hosting platform with instant static deploys, server runtimes, git push-to-deploy with PR previews, rollbacks, custom domains, and cookieless analytics. Use this skill whenever the user wants to deploy, ship, publish, or host a site or app, get a public URL for their work, "put it live", set up deploy-on-push, roll back a bad deploy, or check logs, env vars, domains, or traffic on Slew — even if they don't name Slew explicitly but the project is linked to it (a `slew.json` file exists).
---

# Deploy to Slew

Slew serves every project at `https://<project>.slew.cloud`. Deploys are immutable and live worldwide within seconds; rollbacks are instant pointer flips. Builds happen on your machine (or in Slew's git builders) — `slew deploy` ships already-built output.

## Before anything: CLI and auth

```sh
slew --version   # is the CLI installed?
slew whoami      # is the user logged in?
```

- CLI missing → send the user to https://slew-docs.slew.cloud/cli.html for install instructions (requires Node >= 20.19). Don't guess at an install command.
- Not logged in → run `slew login`. It opens a GitHub device flow in the browser, so the user must be present; in a non-interactive session, ask them to run it themselves or provide a token.
- In CI or headless environments, set `SLEW_TOKEN` instead. Careful: `SLEW_TOKEN` **always overrides** the stored login, so a stale one in the shell causes confusing "wrong account" behavior — check `env | grep SLEW` when identity looks wrong.

## First deploy of a static site

1. **Build first.** Slew serves files as-is; deploy the build output, never the source tree.
2. **Link a project.** `slew init` and `slew deploy` read the link from the current working directory, so `cd` into the project root first:

   ```sh
   slew init my-site        # creates https://my-site.slew.cloud, writes slew.json
   ```

   Names match `[a-z0-9-]{3,40}`. Omit the name to derive it from the directory. If the name is taken by someone else, pick another; if it's the user's own project, `init` links it instead. Use `--org <name>` for team-owned projects.
3. **Deploy the output directory:**

   ```sh
   slew deploy dist
   ```

   It prints the live URL and the deployment id (`dep_…`) — note the id; it's what `slew rollback` takes if this deploy needs reverting. `.git`, `node_modules`, and the top-level `slew.json` are excluded automatically.

Which directory to deploy:

| Stack | Deploy |
| --- | --- |
| Vite, Astro, SvelteKit static | `dist` |
| Next.js static export (`output: 'export'`) | `out` |
| Create React App | `build` |
| Plain HTML/CSS/JS | the folder itself |

SPAs work out of the box: extensionless deep links fall back to `index.html`, while missing assets still 404 properly. A root `404.html` becomes the custom 404 page.

## Verify the deploy

Always confirm before declaring success:

```sh
curl -sI https://<project>.slew.cloud | head -1   # expect HTTP/2 200
```

For an SPA, spot-check one hashed asset and one deep link; for a plain site, confirming the page content is enough. If something is wrong, `slew deployments` lists history and `slew rollback <deployment-id>` restores a previous deploy instantly.

## Server apps (Next.js SSR, Node servers)

Server runtimes deploy via **git push-to-deploy**, not `slew deploy`:

```sh
slew git connect owner/repo --branch main --build-cmd "npm run build" --output dist
```

- First run installs the Slew GitHub App (browser involved — user must be present).
- Every push then builds and deploys; pull requests get preview URLs (disable with `--no-previews`).
- **Next.js**: set `output: 'standalone'` in `next.config.js`; the builder detects it and provisions a server deployment automatically. No other config needed.
- `slew git` shows build status, `slew git build` triggers a build now, `slew git log` prints the latest build log when a build fails.

Runtime management:

```sh
slew env set KEY=value   # injected into the server; restarts on next request
slew env                 # list
slew logs                # runtime logs ("scaled to zero" = hit the URL to wake it)
```

Never put secrets in the deployed files — use `slew env set`.

## Ongoing operations

| Task | Command |
| --- | --- |
| List deploys (● = live) | `slew deployments` |
| Roll back | `slew rollback <deployment-id>` |
| Traffic from edge logs | `slew stats` (`--hours 72` max; longer ranges in the dashboard) |
| Custom domain | `slew domains add www.example.com` → CNAME to the printed target, re-run for TLS |
| Check a domain's TLS | `slew domains cert www.example.com` |
| Throwaway preview URL | `slew share <file-or-dir>` (expires after 7 days; `--ttl 30` max) |
| Password-protect a site | `slew password set <password>` — visitors get an unlock screen on every domain; `slew password rm` reopens it. For shares: `slew share <dir> --password <pw>` |
| CI deploy token | `slew token cli "CI"` → use as `SLEW_TOKEN`; for teams prefer `slew org token <org> deploy` so it survives people leaving |
| Open web console | `slew dashboard` |

`slew share` is the right tool for "look at this real quick" — it needs no project and cleans itself up. `slew init` + `slew deploy` is for the real site.

## Limits and troubleshooting

Limits per deploy: 100 MB compressed, 250 MB uncompressed, 25 MB per file, 10,000 files. Exceeding any fails with a clear message before upload.

| Symptom | Fix |
| --- | --- |
| `Not logged in` | `slew login`, or set `SLEW_TOKEN` in CI |
| `No linked project here` | `slew init` in the directory, or pass `--project <name>` |
| `'<name>' is already taken` | pick another name: `slew init <other-name>` |
| Deployed but site shows old content | HTML caches ~30 s at most and deploys purge the edge — hard-refresh; if truly stale, check `slew deployments` that the new deploy is live (●) |
| Wrong account / mystery auth | stale `SLEW_TOKEN` in the environment overrides `slew login` |
| `slew logs` says scaled to zero | request the site once to wake the instance, retry |
