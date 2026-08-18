// Pulls data from the public Google Sheet and regenerates config.js.
// Sheet must be shared as "Anyone with the link: Viewer".
const SHEET_ID = "1_oV6szOFVhX_lr0lPEOABZbvlUExW2_I1pTz4tnyFxk";
const KV_TABS = ["info", "transfer", "governance"];
const LIST_TABS = ["rules", "council", "alliances", "players", "events", "timeline", "updates"];

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

// Google's gviz CSV endpoint has a footgun: if `sheet=<name>` doesn't match
// any tab, it silently returns the FIRST tab's data instead of erroring.
// We fetch the sentinel tab's raw text once and treat any other tab whose
// raw text matches it byte-for-byte as "not found" (Google fell back to it).
const SENTINEL_TAB = "info";

async function fetchRawCsv(name) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch tab "${name}": ${res.status}`);
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error(`Tab "${name}" returned HTML, not CSV. Make sure the sheet is shared as "Anyone with the link: Viewer".`);
  }
  return text;
}

async function main() {
  const sentinelText = await fetchRawCsv(SENTINEL_TAB);
  const otherNames = [...KV_TABS, ...LIST_TABS].filter((name) => name !== SENTINEL_TAB);

  const rawByName = { [SENTINEL_TAB]: sentinelText };
  await Promise.all(otherNames.map(async (name) => {
    const text = await fetchRawCsv(name);
    if (text === sentinelText) {
      throw new Error(`Tab "${name}" not found in the sheet (Google silently returned the "${SENTINEL_TAB}" tab instead). Add a tab named "${name}".`);
    }
    rawByName[name] = text;
  }));

  const config = {};
  KV_TABS.forEach((name) => { config[name] = toKeyValue(parseCsv(rawByName[name])); });
  LIST_TABS.forEach((name) => { config[name] = toList(parseCsv(rawByName[name])); });

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
