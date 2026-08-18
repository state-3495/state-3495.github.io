// Pulls data from a private Google Sheet (via a Service Account) and regenerates config.js.
// Requires env var GCP_SA_KEY: the full JSON key of a service account that has
// been shared on the sheet as a Viewer.
import { GoogleAuth } from "google-auth-library";

const SHEET_ID = "1_oV6szOFVhX_lr0lPEOABZbvlUExW2_I1pTz4tnyFxk";
const TABS = ["info", "transfer", "updates"];

export function toKeyValue(rows) {
  const out = {};
  for (const [key, value] of rows.slice(1)) {
    if (!key) continue;
    out[key] = value === "TRUE" ? true : value === "FALSE" ? false : value;
  }
  return out;
}

export function toUpdates(rows) {
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

async function fetchTabs() {
  if (!process.env.GCP_SA_KEY) {
    throw new Error("GCP_SA_KEY env var is not set. See README.md for setup.");
  }
  const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.GCP_SA_KEY),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const client = await auth.getClient();

  const ranges = TABS.map((t) => `ranges=${encodeURIComponent(t)}`).join("&");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchGet?${ranges}`;
  const res = await client.request({ url });
  return res.data.valueRanges.map((r) => r.values ?? []);
}

async function main() {
  const [infoRows, transferRows, updatesRows] = await fetchTabs();

  const config = {
    info: toKeyValue(infoRows),
    transfer: toKeyValue(transferRows),
    updates: toUpdates(updatesRows),
  };

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const outPath = path.join(import.meta.dirname, "..", "config.js");
  const content = `// Auto-generated from Google Sheet. Do not edit by hand.\nconst CONFIG = ${JSON.stringify(config, null, 2)};\n`;
  await fs.writeFile(outPath, content);
  console.log(`Wrote ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
