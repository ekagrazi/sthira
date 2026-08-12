import { readFile, rename, writeFile } from "node:fs/promises";

import { generateSeedSql } from "./pipeline.mjs";

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  throw new Error("Usage: node generate-seed-sql.mjs <quotes-json> <output-sql>");
}

const rows = JSON.parse(await readFile(inputPath, "utf8"));
const temporaryPath = `${outputPath}.tmp`;
await writeFile(temporaryPath, generateSeedSql(rows), "utf8");
await rename(temporaryPath, outputPath);
process.stdout.write(`${JSON.stringify({ outputPath, rows: rows.length })}\n`);
