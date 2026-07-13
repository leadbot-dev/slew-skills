#!/usr/bin/env node
// Builds site/ — the deployable skills registry — from skills/.
// Output contract (consumed by `slew skill install`):
//   site/index.json                 registry index: every skill + its files
//   site/skills/<name>/<file>       the raw skill files
//   site/index.html                 human landing page
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const skillsDir = join(root, 'skills')
const siteDir = join(root, 'site')

function frontmatter(md, file) {
  const match = md.match(/^---\n([\s\S]*?)\n---/)
  if (!match) throw new Error(`${file}: missing frontmatter`)
  const fields = {}
  let key = null
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (kv) {
      key = kv[1]
      fields[key] = kv[2]
    } else if (key && /^\s+\S/.test(line)) {
      fields[key] += ` ${line.trim()}`
    }
  }
  if (!fields.name || !fields.description) {
    throw new Error(`${file}: frontmatter needs name and description`)
  }
  return fields
}

async function listFiles(dir, prefix = '') {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...(await listFiles(join(dir, entry.name), rel)))
    else out.push(rel)
  }
  return out.sort()
}

await rm(siteDir, { recursive: true, force: true })
await mkdir(join(siteDir, 'skills'), { recursive: true })

const skills = []
for (const entry of (await readdir(skillsDir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory()) continue
  const dir = join(skillsDir, entry.name)
  const md = await readFile(join(dir, 'SKILL.md'), 'utf8')
  const meta = frontmatter(md, `${entry.name}/SKILL.md`)
  if (meta.name !== entry.name) {
    throw new Error(`${entry.name}: frontmatter name '${meta.name}' must match the directory name`)
  }
  const files = await listFiles(dir)
  await cp(dir, join(siteDir, 'skills', entry.name), { recursive: true })
  skills.push({ name: meta.name, description: meta.description, files })
}

await writeFile(
  join(siteDir, 'index.json'),
  JSON.stringify({ version: 1, skills }, null, 2) + '\n',
)

const rows = skills
  .map(
    (s) => `      <div class="skill">
        <h3>${s.name}</h3>
        <p>${s.description.split('. ')[0]}.</p>
        <pre><code>slew skill install ${s.name}</code></pre>
        <p class="files">${s.files.map((f) => `<a href="skills/${s.name}/${f}">${f}</a>`).join(' · ')}</p>
      </div>`,
  )
  .join('\n')

await writeFile(
  join(siteDir, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>slew skills — deploy from your coding session</title>
<meta name="description" content="Agent skills for slew. Teach Claude Code to deploy your project to slew.cloud.">
<style>
  :root {
    --bg: #060708; --surface: #0c0e11; --border: #1c2129; --text: #e7eaf0;
    --muted: #8b93a3; --accent: #3b82f6;
    --mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    --sans: "Geist", -apple-system, system-ui, sans-serif;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--sans);
         font-size: 15.5px; line-height: 1.65; -webkit-font-smoothing: antialiased; }
  main { max-width: 680px; margin: 0 auto; padding: 64px 24px 96px; }
  h1 { font-size: 28px; margin: 0 0 8px; letter-spacing: -0.02em; }
  h1 span { color: var(--accent); }
  .tag { color: var(--muted); margin: 0 0 40px; }
  h2 { font-size: 18px; margin: 40px 0 12px; }
  h3 { font-size: 16px; margin: 0 0 4px; font-family: var(--mono); font-weight: 600; }
  p { margin: 8px 0; color: var(--muted); }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  pre { background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
        padding: 12px 16px; overflow-x: auto; margin: 12px 0; }
  code { font-family: var(--mono); font-size: 13.5px; color: var(--text); }
  .skill { background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
           padding: 20px 24px; margin: 16px 0; }
  .skill pre { background: var(--bg); }
  .files { font-size: 13px; }
  footer { margin-top: 64px; color: var(--muted); font-size: 13.5px; }
</style>
</head>
<body>
<main>
  <h1>slew <span>skills</span></h1>
  <p class="tag">Teach your coding agent to deploy. Install once — then "deploy this" just works.</p>

  <h2>Install</h2>
  <p>With the <a href="https://slew-docs.slew.cloud/cli.html">slew CLI</a>, inside your project:</p>
  <pre><code>slew skill install slew-deploy</code></pre>
  <p>This drops the skill into <code>.claude/skills/</code>, where Claude Code picks it up
     automatically. Add <code>--global</code> to install for every project on the machine.</p>
  <p>No CLI yet? Copy the files by hand — a skill is just markdown:</p>
  <pre><code>mkdir -p .claude/skills/slew-deploy
curl -fsSL https://skills.slew.cloud/skills/slew-deploy/SKILL.md \\
  -o .claude/skills/slew-deploy/SKILL.md</code></pre>

  <h2>Skills</h2>
${rows}

  <footer>
    <a href="https://slew.cloud">slew</a> — EU-native deploys, at signal speed ·
    <a href="https://slew-docs.slew.cloud">docs</a> ·
    <a href="https://github.com/leadbot-dev/slew-skills">source</a> ·
    <a href="index.json">index.json</a>
  </footer>
</main>
</body>
</html>
`,
)

console.log(`Built site/ with ${skills.length} skill${skills.length === 1 ? '' : 's'}: ${skills.map((s) => s.name).join(', ')}`)
