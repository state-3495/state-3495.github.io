# State 3500 Site

A static site for the Whiteout Survival "State 3500" page, content-managed
through a Google Sheet. GitHub Pages hosts the static files; a GitHub Actions
workflow pulls the sheet on a schedule and regenerates `config.js`.

## How it works

```
Google Sheet (Anyone with the link: Viewer) --> scripts/sync-sheet.js --> config.js --> GitHub Pages
```

No backend server runs anywhere. The sync script fetches the sheet as CSV
(no API key needed) inside GitHub Actions (free for public repos), commits
the regenerated `config.js`, and that push triggers a normal Pages rebuild.

## 1. Sheet sharing

Share the Google Sheet as **"Anyone with the link: Viewer"**. This lets the
sync script read it as CSV without any credentials. Do not put anything
sensitive in this sheet: it's effectively public.

## 2. Sheet structure

The sheet needs exactly 3 tabs, named `info`, `transfer`, `updates`.

**Tab `info`** (2 columns: `field`, `value`)

| field | value |
|---|---|
| number | 3500 |
| tagline | VERIFIED WINNER STATE |
| birthDate | 2026-08-16 |
| svsRecord | 0-0 |
| napLevel | NAP6 |
| ranking | - |

**Tab `transfer`** (2 columns: `field`, `value`)

| field | value |
|---|---|
| isOpen | TRUE |
| groupNumber | - |
| eligibleStatesStart | - |
| eligibleStatesEnd | - |
| periodStart | - |
| periodEnd | - |
| spotsLeft | - |
| spotsTotal | - |
| powerCap | - |

**Tab `updates`** (4 columns, one row per update)

| date | time | title | message |
|---|---|---|---|
| 2026-08-16 | 12:00 | Grand Opening | State 3500 is now open. |

`TRUE`/`FALSE` values are parsed as booleans; everything else stays a string.

## 3. Running the sync

- **Automatic**: the workflow in `.github/workflows/sync-sheet.yml` runs
  every 30 minutes and pushes `config.js` if the sheet changed.
- **Manual**: trigger it anytime from the repo's Actions tab
  ("Sync Google Sheet" > Run workflow), or run it locally:

  ```bash
  npm run sync
  ```

## 4. Local development

```bash
npm test           # runs the parser self-check (no network needed)
python3 -m http.server 8000   # serve index.html + config.js locally
```

## 5. GitHub Pages

Settings > Pages > Source: "Deploy from a branch", Branch: `main` / `(root)`.
