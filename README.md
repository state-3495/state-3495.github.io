# State 3500 Site

A static site for the Whiteout Survival "State 3500" page, content-managed
through a Google Sheet. GitHub Pages hosts the static files; a GitHub Actions
workflow pulls the sheet on a schedule and regenerates `config.js`.

## How it works

```
Google Sheet (Anyone with the link: Viewer) --> scripts/sync-sheet.js --> config.js --> GitHub Pages
```

No backend server runs anywhere. The sync script reads the sheet through the
official Sheets API v4 (with a read-only API key, inside GitHub Actions,
free for public repos), commits the regenerated `config.js`, and that push
triggers a normal Pages rebuild.

Sheet: https://docs.google.com/spreadsheets/d/1_oV6szOFVhX_lr0lPEOABZbvlUExW2_I1pTz4tnyFxk/edit

## 1. Sheet sharing

Share the Google Sheet as **"Anyone with the link: Viewer"**. The API key
below only works for publicly-readable sheets. Do not put anything
sensitive in this sheet: it's effectively public.

## 2. API key setup (one-time)

We previously scraped the sheet as CSV via a public export URL, but that
endpoint has its own server-side cache (edits could take a few minutes to
show up). The Sheets API v4 has no such cache, so edits are reflected
immediately.

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create
   (or reuse) a project.
2. Enable the **Google Sheets API** for that project (APIs & Services >
   Library).
3. Go to APIs & Services > Credentials > Create Credentials > API key.
4. Restrict the key: API restrictions > Google Sheets API only. (This key
   only grants read access to public sheets, but restricting it limits how
   it could be reused if it ever leaked.)
5. In the GitHub repo, go to Settings > Secrets and variables > Actions, and
   add a new secret named `GOOGLE_SHEETS_API_KEY` with the key value.

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

**Tab `alliances`** (one row per alliance)

| name | ranking | power | description | recruiting |
|---|---|---|---|---|
| ICE | 1 | 50M | Main alliance, NAP6 verified | Active 500K+ power players |

**Tab `events`** (recurring daily events, grouped by alliance on the site;
`time1`/`time2` are two daily run times)

| alliance | event | time1 | time2 |
|---|---|---|---|
| ICE | Bear Trap | 14:00 | 20:00 |
| ICE | Crazy Joe | 20:00 | - |
| ICE | Foundry Canyon | 10:00 | 22:00 |

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
  GOOGLE_SHEETS_API_KEY="..." npm run sync
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
