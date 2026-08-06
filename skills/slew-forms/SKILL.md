---
name: slew-forms
description: Wire HTML forms on a Slew-hosted site to Slew Forms — form submissions for any site on slew.cloud, static sites included, with no JavaScript, no backend, and no CORS. Use this skill whenever the user wants a contact form, signup form, feedback box, or any form that "just works" on a site deployed to Slew, wants submissions emailed or exported, or asks to add spam protection, a thank-you redirect, or retention rules to an existing form — even if they don't name Slew explicitly but the project is linked to it (a `slew.json` file exists).
---

# Slew Forms

Every site on Slew accepts form submissions on its own origin: `POST /_slew/forms/<name>`. A form registers itself at the first submission — nothing to declare at build time, no dashboard step, no API key. Submissions land in the console's **Forms** tab and the project's owners get an email.

## Wire a form

Point any HTML form at the endpoint, on the site's own origin:

```html
<form action="/_slew/forms/contact" method="POST">
  <input name="email" type="email" required>
  <textarea name="message"></textarea>
  <input name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
  <button>Send</button>
</form>
```

Rules that matter when generating the markup:

- The path segment after `/_slew/forms/` names the form (`contact`, `signup`, …) — one project holds up to 20 distinct forms.
- `_gotcha` is a spam honeypot: keep it hidden (inline style or CSS), never autofillable. Bots that fill it get a fake success and nothing is stored.
- Field names starting with `_` are reserved for form controls and never stored as data.
- The endpoint is same-origin, so the identical markup works on `<project>.slew.cloud`, custom domains, and branch domains. Never hardcode an absolute host.
- File inputs are ignored (files are not stored); the rest of the submission goes through. Submission limit: 100 fields, 32 KB.

## After submit

- **HTML submissions** are answered with a redirect: to the path in a hidden `_next` field if present (`<input type="hidden" name="_next" value="/thanks">` — must be a path on the same site), else back to the page the form was on, else a minimal confirmation page. For a custom thank-you page, create it and set `_next`.
- **JSON clients** get `{ "ok": true }`. For a `fetch()`-based form:

```js
await fetch('/_slew/forms/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
})
```

Accepted content types: `application/x-www-form-urlencoded`, `multipart/form-data`, `application/json`.

## Verify it works

After deploying, submit once and check it landed:

```sh
curl -s -X POST https://<project>.slew.cloud/_slew/forms/contact \
  -H 'Content-Type: application/json' -d '{"email":"test@example.com"}'   # → {"ok":true}
slew forms                      # the form now lists with 1 submission
slew forms submissions contact  # shows the test submission
```

Delete the test submission afterwards from the console's Forms tab (or leave it and tell the user it's there).

## Manage from the CLI

```sh
slew forms                      # list forms and submission counts
slew forms submissions contact  # recent submissions
slew forms export contact > contact.csv
slew forms notify contact clients@agency.example   # route the email elsewhere
slew forms retention contact 90                    # auto-delete after 90 days
slew forms rm contact                              # delete form + submissions
```

Notifications are batched (a burst is one email) and can be switched off per form in the console while submissions keep collecting.

## GDPR notes worth relaying

Submissions are stored in the EU. No visitor IP addresses or user agents are stored — only the submitted fields and the page path. For personal data, suggest a retention window (`slew forms retention <name> <days>`); export is always available as CSV.

## Limits

Monthly submissions per account/org: Free 100 · Pro 1,000 · Scale 5,000 · Studio 20,000. At the cap, further submissions are refused with an explanatory page. Forms per project: 20.
