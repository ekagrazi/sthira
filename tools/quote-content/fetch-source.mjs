import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const sourceKey = process.argv[2];
const outputDirectory = process.argv[3];
if (!sourceKey || !outputDirectory) {
  throw new Error("Usage: node fetch-source.mjs <source-key> <output-directory>");
}

const sources = JSON.parse(await readFile(join(toolDirectory, "sources.json"), "utf8"));
const source = sources[sourceKey];
if (!source?.fetch_allowed) throw new Error("Source is not approved for fetching.");

const sourceUrls = source.source_urls ?? [source.source_url];
const chunks = [];
let totalBytes = 0;
const fetchedUrls = [];
for (const [index, sourceUrl] of sourceUrls.entries()) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  timeout.unref();
  try {
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "Sthira content preparation/1.0" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok || !response.body) {
      throw new Error(`Source request failed with HTTP ${response.status}.`);
    }
    const approvedUrl = new URL(sourceUrl);
    const finalUrl = new URL(response.url);
    if (finalUrl.protocol !== "https:" || finalUrl.hostname !== approvedUrl.hostname) {
      throw new Error("Source redirected outside its approved HTTPS host.");
    }

    if (index > 0) chunks.push(Buffer.from("\n"));
    chunks.push(Buffer.from(`<!-- STHIRA_SOURCE ${index + 1} ${sourceUrl} -->\n`));
    for await (const chunk of response.body) {
      totalBytes += chunk.byteLength;
      if (totalBytes > 5 * 1024 * 1024) {
        throw new Error("Source collection exceeds the 5 MB limit.");
      }
      chunks.push(Buffer.from(chunk));
    }
    fetchedUrls.push(response.url);
  } finally {
    clearTimeout(timeout);
  }
}

await mkdir(outputDirectory, { recursive: true });
const sourcePath = join(outputDirectory, `${sourceKey}.source.txt`);
const auditPath = join(outputDirectory, `${sourceKey}.fetch-audit.json`);
const temporarySourcePath = `${sourcePath}.tmp`;
const temporaryAuditPath = `${auditPath}.tmp`;
await writeFile(temporarySourcePath, Buffer.concat(chunks));
await writeFile(
  temporaryAuditPath,
  `${JSON.stringify(
    {
      bytes: totalBytes,
      fetched_at: new Date().toISOString(),
      fetched_urls: fetchedUrls,
      rights: source.rights,
      source_url: source.source_url,
    },
    null,
    2,
  )}\n`,
  "utf8",
);
await rename(temporarySourcePath, sourcePath);
await rename(temporaryAuditPath, auditPath);
process.stdout.write(`${JSON.stringify({ auditPath, sourcePath, totalBytes })}\n`);
