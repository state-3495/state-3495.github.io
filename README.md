# State 3500 Site

A static site for the Whiteout Survival "State 3500" page, content-managed
through a Google Sheet. GitHub Pages hosts the static files; a GitHub Actions
workflow pulls the sheet on a schedule and regenerates `config.js`.

## How it works

```
Google Sheet (private) --[Service Account]--> scripts/sync-sheet.js --> config.js --> GitHub Pages
```

No backend server runs anywhere. The sync script runs inside GitHub Actions
(free for public repos), commits the regenerated `config.js`, and that push
triggers a normal Pages rebuild.

## 1. Sheet structure

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

## 2. Service account setup (one-time)

The sheet is shared with specific people only, so the sync job needs its own
Google identity to read it.

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create
   (or reuse) a project.
2. Enable the **Google Sheets API** for that project.
3. Create a **Service Account** (IAM & Admin > Service Accounts), then create
   a JSON key for it and download it.
4. Open the Google Sheet, click Share, and add the service account's email
   (looks like `xxx@yyy.iam.gserviceaccount.com`, found in the JSON key) as
   **Viewer**.
5. In the GitHub repo, go to Settings > Secrets and variables > Actions, and
   add a new secret named `GCP_SA_KEY` with the full contents of the JSON key
   file as the value.

## 3. Running the sync

- **Automatic**: the workflow in `.github/workflows/sync-sheet.yml` runs
  every 30 minutes and pushes `config.js` if the sheet changed.
- **Manual**: trigger it anytime from the repo's Actions tab
  ("Sync Google Sheet" > Run workflow), or run it locally:

  ```bash
  npm install
  GCP_SA_KEY="$(cat service-account.json)" npm run sync
  ```

## 4. Local development

```bash
npm test           # runs the parser self-check (no network needed)
python3 -m http.server 8000   # serve index.html + config.js locally
```

## 5. GitHub Pages

Settings > Pages > Source: "Deploy from a branch", Branch: `main` / `(root)`.
