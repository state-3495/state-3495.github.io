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

Sheet: https://docs.google.com/spreadsheets/d/1_oV6szOFVhX_lr0lPEOABZbvlUExW2_I1pTz4tnyFxk/edit

## 1. Sheet sharing

Share the Google Sheet as **"Anyone with the link: Viewer"**. This lets the
sync script read it as CSV without any credentials. Do not put anything
sensitive in this sheet: it's effectively public.

## 2. Sheet structure

The sheet needs exactly 7 tabs.

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
| groupNumber | - |
| eligibleStatesStart | - |
| eligibleStatesEnd | - |
| periodStart | - |
| periodEnd | - |
| spotsLeft | - |
| spotsTotal | - |
| powerCap | - |

**Tab `alliances`** (one row per alliance)

| name | ranking | power | description |
|---|---|---|---|
| ICE | 1 | 50M | Main alliance, NAP6 verified |

**Tab `players`** (one row per player, grouped by alliance on the site)

| alliance | name | role | power |
|---|---|---|---|
| ICE | PlayerOne | President | 1.2B |

**Tab `events`** (recurring daily events, grouped by alliance on the site)

| alliance | event | time | duration |
|---|---|---|---|
| ICE | Bear Trap | 14:00 | 2:00 |
| ICE | Crazy Joe | 20:00 | 1:00 |
| ICE | Foundry Canyon | 10:00 | 3:00 |

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
else stays a string. Adding a row to any table tab adds a line on the site;
adding a column adds one automatically to `alliances`/`players`/`events`
(they render as generic tables) without any code change.

## 3. Running the sync

- **Automatic**: the workflow in `.github/workflows/sync-sheet.yml` runs
  daily at 09:00 KST and pushes `config.js` if the sheet changed.
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
