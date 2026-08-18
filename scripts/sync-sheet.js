// Pulls data from the public Google Sheet and regenerates config.js.
// Sheet must be shared as "Anyone with the link: Viewer".
const SHEET_ID = "1_oV6szOFVhX_lr0lPEOABZbvlUExW2_I1pTz4tnyFxk";
const TABS = ["info", "transfer", "updates"];

export function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cell += c; }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cell); cell = "";
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else {
      cell += c;
    }
  }
  row.push(cell);
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

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

async function fetchTab(name) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch tab "${name}": ${res.status}`);
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error(`Tab "${name}" returned HTML, not CSV. Make sure the sheet is shared as "Anyone with the link: Viewer" and a tab named "${name}" exists.`);
  }
  return parseCsv(text);
}

async function main() {
  const [infoRows, transferRows, updatesRows] = await Promise.all(TABS.map(fetchTab));

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
