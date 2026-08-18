# State 3500 Site

A static site for the Whiteout Survival "State 3500" page, content-managed
through a Google Sheet. GitHub Pages hosts the static files; a GitHub Actions
workflow pulls the sheet on a schedule and regenerates `config.js`.

## How it works

```
Google Sheet (private, shared with a service account) --> scripts/sync-sheet.js --> config.js --> GitHub Pages
```

No backend server runs anywhere. The sync script reads the sheet through the
official Sheets API v4, authenticated as a Google service account (inside
GitHub Actions, free for public repos), commits the regenerated `config.js`,
and that push triggers a normal Pages rebuild. The sheet ID and the service
account key are both GitHub Actions secrets, never committed to the repo.

## 1. Sheet sharing

The sheet does **not** need to be publicly shared. Share it only with the
service account's email (see step 2 below) as **Viewer**. If it was
previously shared as "Anyone with the link", you can remove that now.

## 2. Service account setup (one-time)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create
   (or reuse) a project.
2. Enable the **Google Sheets API** for that project (APIs & Services >
   Library).
3. Create a **Service Account** (IAM & Admin > Service Accounts), then create
   a JSON key for it and download it.
4. Share the Google Sheet with the service account's email (the
   `client_email` field in the JSON key, looks like
   `xxx@yyy.iam.gserviceaccount.com`) as **Viewer**.
5. In the GitHub repo, go to Settings > Secrets and variables > Actions, and
   add two secrets:
   - `GCP_SA_KEY`: the full contents of the JSON key file
   - `GOOGLE_SHEET_ID`: the sheet's ID (the long string in its URL, between
     `/d/` and `/edit`)

## 3. Sheet structure

The sheet needs exactly 8 tabs.

**Tab `info`** (2 columns: `field`, `value`)

| field | value |
|---|---|
| number | 3500 |
| tagline | VERIFIED WINNER STATE |
| birthDate | 2026-08-16 |
| svsRecord | 0-0 |
| leadingStateWins | 0 |
| napLevel | NAP6 |
| ranking | - |
| svsRating | 4 (optional, 0-5 star rating shown above the SVS table) |
| svsNote | Records start from the date tracking began. (optional footnote under the SVS table) |

**Tab `transfer`** (2 columns: `field`, `value`)

| field | value |
|---|---|
| isOpen | TRUE |
| leadingState | TRUE (optional; shows an orange "LEADING" badge next to OPEN/CLOSED) |
| groupNumber | - |
| eligibleStatesStart | - |
| eligibleStatesEnd | - |
| periodStart | - |
| periodEnd | - |
| spotsLeft | - |
| spotsTotal | - |
| powerCap | - |
| specialTickets | - |

**Tab `governance`** (2 columns: `field`, `value`)

| field | value |
|---|---|
| peaceLevelLabel | Peace Level |
| peaceLevelStatus | Stable |
| peaceLevelDescription | No active wars in state. |
| peaceLevelPercentage | 90 |
| napCoverageValue | 8/8 top alliances |
| napCoverageDescription | All top alliances have signed NAP. |
| kePolicyValue | Warn once, then kick |
| kePolicyDescription | KE offenders get one warning. |

**Tab `rules`** (1 column: `rule`, one row per rule)

| rule |
|---|
| No KE without a declared war. |

**Tab `council`** (one row per member; a `discord` column renders as a
clickable icon that opens a copy-to-clipboard popup instead of plain text)

| member | Role | alliance | power | discord |
|---|---|---|---|---|
| PlayerOne | President | ICE | 1.2B | PlayerOne#1234 |

**Tab `alliances`** (one row per alliance; `tag` is the short in-game alliance
tag used to match rows in `players`/`events`/`council`, `name` is the full
display name shown on the site as `[tag] name`)

| tag | name | ranking | power | description | recruiting |
|---|---|---|---|---|---|
| ICE | IcebornSquirrel | 1 | 50M | Main alliance, NAP6 verified | Active 500K+ power players |

`recruiting` renders as a "Looking for: ..." callout under the description.
Make sure the `alliance` column in `players`/`events`/`council` matches
the `tag` value here exactly (not the display name).

**Tab `events`** (recurring daily events, grouped by alliance on the site;
`time1`/`time2` are two daily run times)

| alliance | event | time1 | time2 |
|---|---|---|---|
| ICE | Bear Trap | 14:00 | 20:00 |
| ICE | Crazy Joe | 20:00 | - |
| ICE | Foundry Canyon | 10:00 | 22:00 |

**Tab `svs`** (one row per SVS match, shown in the SVS Track Record card)

| enemy | prep | battle | score |
|---|---|---|---|
| #3201 | TRUE | FALSE | 8.6B |
| #3269 | FALSE | TRUE | 7.8B |

**Tab `timeline`** (state-age milestones, not alliance-specific; see
[whiteoutsurvival.pl/state-timeline](https://whiteoutsurvival.pl/state-timeline/)
for reference values)

| day | title | description |
|---|---|---|
| 0 | State Opens | Server launch day. |
| 14 | Tundra Unlocked | Tundra region opens up. |

**Tab `updates`** (news feed, one row per update)

| date | time | title | message |
|---|---|---|---|
| 2026-08-16 | 12:00 | Grand Opening | State 3500 is now open. |

`TRUE`/`FALSE` values in `info`/`transfer` are parsed as booleans; everything
else stays a string. Adding a row to `alliances`/`events`/`rules`/`council`/
`updates` adds a line on the site; adding a column to `alliances`/`events`
renders automatically without any code change.

## 4. Running the sync

- **Automatic**: the workflow in `.github/workflows/sync-sheet.yml` runs
  every 10 minutes and pushes `config.js` if the sheet changed.
- **Manual**: trigger it anytime from the repo's Actions tab
  ("Sync Google Sheet" > Run workflow), or run it locally:

  ```bash
  GOOGLE_SHEET_ID="..." GCP_SA_KEY="$(cat service-account.json)" npm run sync
  ```

## 5. Local development

```bash
npm test           # runs the parser self-check (no network needed)
python3 -m http.server 8000   # serve index.html + config.js locally
```

## 6. GitHub Pages

This repo is named `state-3500.github.io`, so GitHub Pages serves it
automatically at https://state-3500.github.io/ with no Settings > Pages
configuration needed.
