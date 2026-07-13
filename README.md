# slew-skills

Agent skills for [slew](https://slew.cloud) — teach Claude Code (or any agent that reads
[skills](https://code.claude.com/docs/en/skills)) to deploy straight from a coding session.

Live registry: **https://skills.slew.cloud**

## Install a skill

Inside your project, with the [slew CLI](https://slew-docs.slew.cloud/cli.html):

```sh
slew skill install slew-deploy      # → .claude/skills/slew-deploy/
slew skill install slew-deploy --global   # → ~/.claude/skills/ for every project
```

Then just ask your agent to "deploy this" — it knows the rest.

Without the CLI, a skill is plain markdown; copy it by hand:

```sh
mkdir -p .claude/skills/slew-deploy
curl -fsSL https://skills.slew.cloud/skills/slew-deploy/SKILL.md \
  -o .claude/skills/slew-deploy/SKILL.md
```

## Skills

| Skill | What it teaches the agent |
| --- | --- |
| [`slew-deploy`](skills/slew-deploy/SKILL.md) | Deploy static sites and server apps to slew: init, deploy, verify, git push-to-deploy, env vars, logs, rollbacks, domains, shares. |

## Repository layout

```
skills/<name>/SKILL.md    the skills (source of truth)
scripts/build-site.mjs    generates site/ from skills/
site/                     generated — the registry served at skills.slew.cloud
```

`site/index.json` is the machine-readable index the CLI installs from:

```json
{ "version": 1, "skills": [{ "name": "…", "description": "…", "files": ["SKILL.md"] }] }
```

## Developing

```sh
node scripts/build-site.mjs   # regenerate site/
slew deploy site              # ship the registry (project: skills)
```

Add a skill by creating `skills/<name>/SKILL.md` with `name` and `description`
frontmatter (the `name` must match the directory), rebuild, and deploy.
