import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  parseSourceText,
  runBounded,
  tagQuote,
  validateRows,
} from "./pipeline.mjs";

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const sourceKey = process.argv[2];
const inputPath = process.argv[3];
const outputDirectory = process.argv[4];
const concurrency = Number(process.argv[5] ?? "2");
if (!sourceKey || !inputPath || !outputDirectory) {
  throw new Error(
    "Usage: node prepare-source.mjs <source-key> <input-file> <output-directory> [concurrency]",
  );
}

const [sources, vocabulary, rawText] = await Promise.all([
  readFile(join(toolDirectory, "sources.json"), "utf8").then(JSON.parse),
  readFile(join(toolDirectory, "controlled-vocabulary.json"), "utf8").then(
    JSON.parse,
  ),
  readFile(inputPath, "utf8"),
]);
const source = sources[sourceKey];
if (!source?.fetch_allowed) throw new Error("Unknown or unapproved source.");

const parsedRows = parseSourceText(source, rawText);
const taggedRows = [];
const checkpointEvery = 25;
await mkdir(outputDirectory, { recursive: true });
const checkpointPath = join(outputDirectory, `${sourceKey}.checkpoint.json`);

async function writeJsonAtomic(path, value) {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

for (let start = 0; start < parsedRows.length; start += checkpointEvery) {
  const batch = parsedRows.slice(start, start + checkpointEvery);
  taggedRows.push(
    ...(await runBounded(batch, concurrency, async (row) => tagQuote(row, vocabulary))),
  );
  await writeJsonAtomic(checkpointPath, {
    processed: taggedRows.length,
    rows: taggedRows,
    source_key: sourceKey,
  });
}

const { accepted, audit } = validateRows(taggedRows, source, vocabulary);
const quotesPath = join(outputDirectory, `${sourceKey}.quotes.json`);
const auditPath = join(outputDirectory, `${sourceKey}.import-audit.json`);
await Promise.all([
  writeJsonAtomic(quotesPath, accepted),
  writeJsonAtomic(auditPath, {
    accepted: accepted.length,
    records: audit,
    rejected: audit.length - accepted.length,
    rights: source.rights,
    source_url: source.source_url,
  }),
]);
process.stdout.write(
  `${JSON.stringify({ accepted: accepted.length, auditPath, quotesPath })}\n`,
);
