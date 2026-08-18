// Pulls data from a private Google Sheet (via a Service Account) and
// regenerates config.js. The sheet is NOT publicly shared: it's only
// shared with the service account's email as Viewer.
// Requires env vars GOOGLE_SHEET_ID and GCP_SA_KEY. See README.md for setup.
import { GoogleAuth } from "google-auth-library";

const KV_TABS = ["info", "transfer", "governance"];
const LIST_TABS = ["rules", "council", "alliances", "events", "svs", "timeline", "updates"];

export function toKeyValue(rows) {
  const out = {};
  for (const [key, value] of rows.slice(1)) {
    if (!key) continue;
    out[key] = value === "TRUE" ? true : value === "FALSE" ? false : value;
  }
  return out;
}

export function toList(rows) {
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

async function fetchAllTabs(sheetId, names) {
  const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.GCP_SA_KEY),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const client = await auth.getClient();

  const params = names.map((n) => `ranges=${encodeURIComponent(n)}`).join("&");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?${params}`;
  const res = await client.request({ url });
  return res.data.valueRanges.map((r) => r.values || []);
}

async function main() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID env var is not set. See README.md for setup.");
  }
  if (!process.env.GCP_SA_KEY) {
    throw new Error("GCP_SA_KEY env var is not set. See README.md for setup.");
  }

  const names = [...KV_TABS, ...LIST_TABS];
  const rows = await fetchAllTabs(sheetId, names);
  const rowsByName = Object.fromEntries(names.map((name, i) => [name, rows[i]]));

  const config = {};
  KV_TABS.forEach((name) => { config[name] = toKeyValue(rowsByName[name]); });
  LIST_TABS.forEach((name) => { config[name] = toList(rowsByName[name]); });

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const crypto = await import("node:crypto");
  const dir = path.join(import.meta.dirname, "..");
  const content = `// Auto-generated from Google Sheet. Do not edit by hand.\nconst CONFIG = ${JSON.stringify(config, null, 2)};\n`;
  await fs.writeFile(path.join(dir, "config.js"), content);

  // Cache-bust config.js so GitHub Pages' CDN cache (max-age=600) and
  // browser cache don't serve stale data after a sync.
  const version = crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
  const indexPath = path.join(dir, "index.html");
  const html = await fs.readFile(indexPath, "utf8");
  const updatedHtml = html.replace(/config\.js(\?v=[a-f0-9]+)?"/, `config.js?v=${version}"`);
  await fs.writeFile(indexPath, updatedHtml);

  console.log(`Wrote config.js and index.html (v=${version})`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
