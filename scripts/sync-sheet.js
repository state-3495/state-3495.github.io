// Pulls data from the public Google Sheet and regenerates config.js.
// Sheet must be shared as "Anyone with the link: Viewer".
const SHEET_ID = "1_oV6szOFVhX_lr0lPEOABZbvlUExW2_I1pTz4tnyFxk";
const KV_TABS = ["info", "transfer"];
const LIST_TABS = ["alliances", "players", "events", "timeline", "updates"];

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

export function toList(rows) {
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
  const [kvRows, listRows] = await Promise.all([
    Promise.all(KV_TABS.map(fetchTab)),
    Promise.all(LIST_TABS.map(fetchTab)),
  ]);

  const config = {};
  KV_TABS.forEach((name, i) => { config[name] = toKeyValue(kvRows[i]); });
  LIST_TABS.forEach((name, i) => { config[name] = toList(listRows[i]); });

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
