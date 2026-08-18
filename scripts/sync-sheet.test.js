import assert from "node:assert/strict";
import { parseCsv, toKeyValue, toUpdates } from "./sync-sheet.js";

assert.deepEqual(
  parseCsv('field,value\nnumber,3500\ntagline,"Verified, Winner"\n'),
  [["field", "value"], ["number", "3500"], ["tagline", "Verified, Winner"]]
);

assert.deepEqual(toKeyValue([["field", "value"], ["isOpen", "TRUE"], ["spots", "12"]]), {
  isOpen: true,
  spots: "12",
});

assert.deepEqual(
  toUpdates([["date", "title"], ["2026-08-16", "Open"]]),
  [{ date: "2026-08-16", title: "Open" }]
);

console.log("sync-sheet self-check: OK");
