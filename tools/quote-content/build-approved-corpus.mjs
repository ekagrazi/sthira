import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  generateSeedSql,
  normalizeWhitespace,
  parseSourceText,
  tagQuote,
  validateRows,
} from "./pipeline.mjs";

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const workDirectory = process.argv[2] ?? join(toolDirectory, "work");
const migrationPath = process.argv[3];
if (!migrationPath) {
  throw new Error("Usage: node build-approved-corpus.mjs [work-directory] <migration-sql>");
}

const [sources, vocabulary] = await Promise.all([
  readFile(join(toolDirectory, "sources.json"), "utf8").then(JSON.parse),
  readFile(join(toolDirectory, "controlled-vocabulary.json"), "utf8").then(JSON.parse),
]);

const reflectiveTerms = [
  "accept", "action", "attention", "calm", "change", "choice", "compassion",
  "content", "control", "courage", "desire", "discipline", "duty", "effort",
  "endure", "fear", "freedom", "friend", "good", "grief", "heart", "hope",
  "kind", "knowledge", "life", "love", "mind", "patience", "peace", "present",
  "purpose", "quiet", "reason", "reflect", "self", "sorrow", "strength", "truth",
  "wisdom", "work",
];
const unsuitableTerms = [
  "hell", "slaughter", "enemy", "caste", "woman", "wives", "warrior", "sacrifice",
  "murder", "punishment", "torture", "damnation",
];

function qualityScore(row, featured = new Set()) {
  const text = normalizeWhitespace(row.text).toLocaleLowerCase("en");
  let score = featured.has(row.citation) ? 100 : 0;
  for (const term of reflectiveTerms) if (text.includes(term)) score += 3;
  for (const term of unsuitableTerms) if (text.includes(term)) score -= 7;
  if (text.length >= 65 && text.length <= 260) score += 12;
  else if (text.length <= 380) score += 5;
  else score -= 8;
  if (/[!?]$/u.test(text)) score -= 1;
  return score;
}

function selectByGroup(rows, quotas, groupOf, featured = new Set()) {
  const selected = [];
  for (const [group, quota] of Object.entries(quotas)) {
    const candidates = rows
      .filter((row) => String(groupOf(row)) === group)
      .filter((row) => normalizeWhitespace(row.text).length <= 500)
      .sort((left, right) => qualityScore(right, featured) - qualityScore(left, featured) || left.citation.localeCompare(right.citation));
    const diverse = candidates.filter((row, index, all) =>
      all.findIndex((candidate) => candidate.citation === row.citation) === index
    );
    if (diverse.length < quota) throw new Error(`Only ${diverse.length} candidates for group ${group}; ${quota} required.`);
    selected.push(...diverse.slice(0, quota));
  }
  return selected;
}

function citationChapter(row) {
  const match = row.citation.match(/(?:Gita|Meditations|Book)\s+(\d+)(?:[.,:]|$)/u);
  return match ? Number(match[1]) : null;
}

const dhammapadaRanges = [
  [1, 20], [21, 32], [33, 43], [44, 59], [60, 75], [76, 89], [90, 99],
  [100, 115], [116, 128], [129, 145], [146, 156], [157, 166], [167, 178],
  [179, 196], [197, 208], [209, 220], [221, 234], [235, 255], [256, 272],
  [273, 289], [290, 305], [306, 319], [320, 333], [334, 359], [360, 382], [383, 423],
];

function dhammapadaChapter(row) {
  const verse = Number(row.citation.match(/(\d+)$/u)?.[1]);
  return dhammapadaRanges.findIndex(([start, end]) => verse >= start && verse <= end) + 1;
}

function cleanSourceRows(rows) {
  return rows.map((row) => ({
    ...row,
    text: normalizeWhitespace(row.text)
      .replace(/\s+Chapter [IVXLCDM]+\..*$/u, "")
      .replace(/\s+\d+$/u, "")
      .replace(/\s+([,.;!?])/gu, "$1"),
  }));
}

async function parsedSource(key) {
  const raw = await readFile(join(workDirectory, `${key}.source.txt`), "utf8");
  return cleanSourceRows(parseSourceText(sources[key], raw));
}

const dhammapadaQuotas = Object.fromEntries(Array.from({ length: 26 }, (_, index) => [index + 1, 4]));
for (const chapter of [1, 2, 3, 6, 10, 12]) dhammapadaQuotas[chapter] += 1;
const dhammapadaFeatured = new Set([
  "Dhammapada 1", "Dhammapada 2", "Dhammapada 5", "Dhammapada 6", "Dhammapada 21",
  "Dhammapada 35", "Dhammapada 50", "Dhammapada 61", "Dhammapada 80", "Dhammapada 81",
  "Dhammapada 100", "Dhammapada 103", "Dhammapada 116", "Dhammapada 122",
  "Dhammapada 129", "Dhammapada 130", "Dhammapada 133", "Dhammapada 160",
  "Dhammapada 165", "Dhammapada 183", "Dhammapada 197", "Dhammapada 221",
  "Dhammapada 223", "Dhammapada 276", "Dhammapada 320", "Dhammapada 328",
  "Dhammapada 354", "Dhammapada 372", "Dhammapada 379", "Dhammapada 406",
]);
const dhammapada = selectByGroup(await parsedSource("buddha"), dhammapadaQuotas, dhammapadaChapter, dhammapadaFeatured);

const gitaQuotas = {
  1: 2, 2: 13, 3: 9, 4: 8, 5: 7, 6: 9, 7: 5, 8: 4, 9: 7,
  10: 4, 11: 3, 12: 8, 13: 5, 14: 4, 15: 4, 16: 6, 17: 4, 18: 8,
};
const gitaFeatured = new Set([
  "Bhagavad Gita 2.7", "Bhagavad Gita 2.14", "Bhagavad Gita 2.20", "Bhagavad Gita 2.38",
  "Bhagavad Gita 2.47", "Bhagavad Gita 2.48", "Bhagavad Gita 2.50", "Bhagavad Gita 2.56",
  "Bhagavad Gita 2.62", "Bhagavad Gita 2.63", "Bhagavad Gita 2.70", "Bhagavad Gita 3.19",
  "Bhagavad Gita 3.35", "Bhagavad Gita 4.7", "Bhagavad Gita 4.11", "Bhagavad Gita 4.38",
  "Bhagavad Gita 5.10", "Bhagavad Gita 5.18", "Bhagavad Gita 6.5", "Bhagavad Gita 6.6",
  "Bhagavad Gita 6.26", "Bhagavad Gita 6.35", "Bhagavad Gita 9.22", "Bhagavad Gita 12.13",
  "Bhagavad Gita 12.14", "Bhagavad Gita 12.15", "Bhagavad Gita 13.28", "Bhagavad Gita 14.22",
  "Bhagavad Gita 16.1", "Bhagavad Gita 17.15", "Bhagavad Gita 18.47", "Bhagavad Gita 18.66",
]);
const gita = selectByGroup(await parsedSource("bhagavad-gita"), gitaQuotas, citationChapter, gitaFeatured);

const meditationQuotas = { 1: 4, 2: 4, 3: 4, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 4, 11: 3, 12: 3 };
const meditationFeatured = new Set([
  "Meditations 2.1", "Meditations 2.4", "Meditations 3.5", "Meditations 4.3",
  "Meditations 4.17", "Meditations 5.1", "Meditations 5.16", "Meditations 6.6",
  "Meditations 6.30", "Meditations 7.54", "Meditations 8.36", "Meditations 9.6",
  "Meditations 10.16", "Meditations 11.18", "Meditations 12.1",
]);
const meditations = selectByGroup(await parsedSource("marcus-aurelius"), meditationQuotas, citationChapter, meditationFeatured);

const marcusSource = sources["marcus-aurelius"];
const marcusLetters = [
  ["I learn from you to speak the truth, and to hear the truth without disguise.", "Correspondence with Fronto, Ad M. Caes. 3.12"],
  ["I prefer to write unwisely rather than to be silent unkindly.", "Correspondence with Fronto, Ad M. Caes. 2.2"],
  ["What concerns the case must be clearly brought forward; what concerns personal feeling should be left unsaid.", "Correspondence with Fronto, Ad M. Caes. 3.5 (paraphrase)"],
  ["I cannot endure to write to you unless my mind is at ease, untroubled, and free.", "Correspondence with Fronto, Ad M. Caes. 3.21"],
  ["Farewell, my master, always in every chance first in my mind, as you deserve to be.", "Correspondence with Fronto, Ad M. Caes. 3.21"],
  ["When you rest and do what is good for your health, I too am the better for it.", "Correspondence with Fronto, letter of 139 CE"],
  ["When you lie ill, my spirit also lies low; when you stand upright, my spirit stands firm.", "Correspondence with Fronto, Ad M. Caes. 3.19 (paraphrase)"],
  ["After returning home, I went straight to my books.", "Correspondence with Fronto, Ad M. Caes. 4.5"],
  ["I did my task and gave an account of the day to my delightful master.", "Correspondence with Fronto, Ad M. Caes. 4.6"],
  ["I can love you while far away.", "Correspondence with Fronto, Ad M. Caes. 4.6"],
  ["If you miss me and love me, send your letters often; they are a comfort and consolation to me.", "Correspondence with Fronto, Ad Verum Imp. 2.1"],
  ["I would rather hear honest correction than praise that leaves me unchanged.", "Correspondence with Fronto, Ad M. Caes. 3.12 (paraphrase)"],
  ["The intention of friendship is shown by speaking before silence becomes unkind.", "Correspondence with Fronto, Ad M. Caes. 2.2 (paraphrase)"],
].map(([text, citation]) => ({
  citation,
  content_type: "paraphrase",
  guide_slug: "marcus-aurelius",
  mood_tags: [],
  rights_basis: "Public-domain correspondence reproduced in the Project Gutenberg edition of Meditations",
  source_url: marcusSource.source_url,
  source_work: "Correspondence with Fronto",
  text,
  themes: [],
  translator: null,
}));

function onePerCitation(rows, count) {
  const selected = [];
  const seen = new Set();
  for (const row of rows.sort((left, right) => qualityScore(right) - qualityScore(left))) {
    if (seen.has(row.citation)) continue;
    selected.push(row);
    seen.add(row.citation);
    if (selected.length === count) break;
  }
  if (selected.length < count) throw new Error(`Only ${selected.length} distinct selections; ${count} required.`);
  return selected;
}

function isCompletePoetryPassage(row) {
  const text = normalizeWhitespace(row.text);
  const doubleQuotes = (text.match(/"/gu) ?? []).length;
  return /^[A-Z'‘“]/u.test(text)
    && /[.!?]["'’”]?$/u.test(text)
    && !/^(?:Again|And|But|Journeyed|Not|Shed|That|Then|Was|Which)\b/u.test(text)
    && !/\d|\u00ae|\b(?:com|tli|tlie|tliou)\w*\b|,rt\b|\w+-\s+\w+/iu.test(text)
    && doubleQuotes % 2 === 0;
}

const masnaviRows = await parsedSource("rumi");
const masnavi = Object.values(Object.fromEntries(Array.from({ length: 6 }, (_, index) => [index + 1, true])))
  .flatMap((_, index) => onePerCitation(masnaviRows.filter((row) =>
    citationChapter(row) === index + 1
    && isCompletePoetryPassage(row)
  ), 5));
const divan = onePerCitation((await parsedSource("rumi-divan")).filter((row) =>
  isCompletePoetryPassage(row)
), 20);

const camusSource = {
  guide_slug: "camus",
  source_url: "https://www.nobelprize.org/prizes/literature/1957/camus/bibliography/",
  source_work: "Albert Camus bibliography",
  rights: "Original source-based reflection; no English translation reproduced",
};
const camusReflections = [
  ["Absurd awareness begins when familiar routines stop feeling self-evident.", "The Myth of Sisyphus — An Absurd Reasoning"],
  ["The question of whether life is worth living comes before abstract systems about it.", "The Myth of Sisyphus — An Absurd Reasoning"],
  ["The absurd arises where the human demand for clarity meets a world that gives no final answer.", "The Myth of Sisyphus — Absurd Walls"],
  ["Acknowledging the limits of reason does not require abandoning reason.", "The Myth of Sisyphus — Philosophical Suicide"],
  ["Lucidity refuses both false consolation and passive despair.", "The Myth of Sisyphus — Absurd Freedom"],
  ["What matters is staying with the question instead of escaping through invented certainty.", "The Myth of Sisyphus — Absurd Freedom"],
  ["Freedom grows when inherited guarantees no longer dictate how life must be lived.", "The Myth of Sisyphus — Absurd Freedom"],
  ["The absence of a final explanation still leaves room for conscious choice.", "The Myth of Sisyphus — Absurd Freedom"],
  ["Revolt is the repeated decision to live without denying contradiction.", "The Myth of Sisyphus — Absurd Freedom"],
  ["Intensity depends on attention to experience rather than promises about another life.", "The Myth of Sisyphus — Absurd Freedom"],
  ["Don Juan represents a multiplicity of experience, not the discovery of one final possession.", "The Myth of Sisyphus — Don Juanism"],
  ["The actor shows how many lives can be inhabited within one limited lifetime.", "The Myth of Sisyphus — Drama"],
  ["The conqueror values engaged action while knowing every achievement is temporary.", "The Myth of Sisyphus — Conquest"],
  ["Art can describe an absurd condition without pretending to resolve it.", "The Myth of Sisyphus — Philosophy and Fiction"],
  ["Creation gives form to experience while respecting what remains unexplained.", "The Myth of Sisyphus — Absurd Creation"],
  ["Kirilov's reasoning exposes the danger of turning logical consistency into self-destruction.", "The Myth of Sisyphus — Kirilov"],
  ["Sisyphus becomes meaningful as an image of consciousness returning to its task.", "The Myth of Sisyphus — The Myth of Sisyphus"],
  ["Awareness can transform imposed repetition into a consciously carried defiance.", "The Myth of Sisyphus — The Myth of Sisyphus"],
  ["Rebellion begins with a refusal that also affirms something worth defending.", "The Rebel — The Rebel"],
  ["When a limit is crossed, the protest implicitly appeals to a dignity shared with others.", "The Rebel — The Rebel"],
  ["Genuine rebellion resists humiliation without claiming unlimited permission.", "The Rebel — The Rebel"],
  ["Solidarity begins when suffering is recognized as more than a private condition.", "The Rebel — The Rebel"],
  ["Metaphysical rebellion contests an unjust world while remaining attached to life.", "The Rebel — Metaphysical Rebellion"],
  ["Nihilism becomes destructive when denial is allowed to become its only principle.", "The Rebel — Metaphysical Rebellion"],
  ["Revolution betrays rebellion when future justice is used to excuse present cruelty.", "The Rebel — Historical Rebellion"],
  ["The means used for liberation inevitably shape the freedom that follows.", "The Rebel — Historical Rebellion"],
  ["Historical certainty becomes dangerous when living people are treated as material for an idea.", "The Rebel — Historical Rebellion"],
  ["Rebellion requires measure: neither submission nor domination can be made absolute.", "The Rebel — Thought at the Meridian"],
  ["Art rebels by giving experience form without reducing it to doctrine.", "The Rebel — Rebellion and Art"],
  ["The artist preserves human complexity against systems that demand total agreement.", "The Rebel — Rebellion and Art"],
  ["Justice without freedom becomes oppression; freedom without limits becomes permission for harm.", "The Rebel — Thought at the Meridian"],
  ["Balanced thought refuses the false purity promised by political extremes.", "The Rebel — Thought at the Meridian"],
  ["A rebel accepts responsibility for consequences instead of hiding behind history.", "The Rebel — Beyond Nihilism"],
  ["Shared limits make coexistence possible even where agreement is incomplete.", "The Rebel — Beyond Nihilism"],
  ["Resistance begins by refusing to let force decide what is true or human.", "Resistance, Rebellion and Death — Letters to a German Friend"],
  ["Love of one's country need not require hatred of another people.", "Resistance, Rebellion and Death — Letters to a German Friend"],
  ["A just cause is damaged when it adopts the contempt practiced by its opponent.", "Resistance, Rebellion and Death — Letters to a German Friend"],
  ["Courage includes preserving moral limits when circumstances reward cruelty.", "Resistance, Rebellion and Death — Letters to a German Friend"],
  ["Political realism becomes empty when it forgets the people in whose name it acts.", "Resistance, Rebellion and Death — Neither Victims nor Executioners"],
  ["Refusing both victimhood and execution is a difficult commitment to human limits.", "Resistance, Rebellion and Death — Neither Victims nor Executioners"],
  ["Conversation remains possible only when no side claims the right to silence every other voice.", "Resistance, Rebellion and Death — Neither Victims nor Executioners"],
  ["Peace requires practical restraint, not merely agreement with peaceful ideals.", "Resistance, Rebellion and Death — Neither Victims nor Executioners"],
  ["The artist serves the present by refusing both isolation and propaganda.", "Resistance, Rebellion and Death — The Artist and His Time"],
  ["Creation becomes honest when it stays close to ordinary lives and shared suffering.", "Resistance, Rebellion and Death — The Artist and His Time"],
  ["To create dangerously is to accept responsibility without surrendering independence.", "Resistance, Rebellion and Death — Create Dangerously"],
  ["Art matters because it can hold beauty and injustice in view at the same time.", "Resistance, Rebellion and Death — Create Dangerously"],
  ["Capital punishment closes the possibility of correction while claiming certainty about judgment.", "Resistance, Rebellion and Death — Reflections on the Guillotine"],
  ["A society should not teach restraint through an irreversible act of violence.", "Resistance, Rebellion and Death — Reflections on the Guillotine"],
  ["At Tipasa, attention to sun, sea, stone, and body becomes a form of gratitude.", "Nuptials — Nuptials at Tipasa"],
  ["Joy can be immediate without pretending that suffering or death do not exist.", "Nuptials — Nuptials at Tipasa"],
  ["The natural world offers presence, not an argument about what life must mean.", "Nuptials — Nuptials at Tipasa"],
  ["A life fully felt does not need to be postponed until every question is settled.", "Nuptials — Nuptials at Tipasa"],
  ["Algiers reveals a fierce attachment to life lived openly in the body and the weather.", "Nuptials — Summer in Algiers"],
  ["Poverty does not erase beauty, though beauty should never be used to disguise hardship.", "Nuptials — Summer in Algiers"],
  ["The desert city invites an honesty stripped of unnecessary decoration.", "The Myth of Sisyphus and Other Essays — The Minotaur"],
  ["Solitude can clear perception when it is not confused with withdrawal from life.", "The Myth of Sisyphus and Other Essays — The Minotaur"],
  ["Returning to a beloved place does not restore the past; it tests what remains alive in us.", "The Myth of Sisyphus and Other Essays — Return to Tipasa"],
  ["Even after history's violence, beauty can remain a reason to resist despair.", "The Myth of Sisyphus and Other Essays — Return to Tipasa"],
  ["Hope becomes credible when it grows beside suffering rather than denying it.", "The Myth of Sisyphus and Other Essays — Return to Tipasa"],
  ["The sea offers no doctrine, yet its nearness can return attention to the living present.", "The Myth of Sisyphus and Other Essays — The Sea Close By"],
].map(([text, citation]) => ({
  citation,
  content_type: "source_based_reflection",
  guide_slug: "camus",
  mood_tags: [],
  rights_basis: camusSource.rights,
  source_url: camusSource.source_url,
  source_work: citation.split(" — ")[0],
  text,
  themes: [],
  translator: null,
}));

const grouped = [
  ["buddha", dhammapada, sources.buddha],
  ["bhagavad-gita", gita, sources["bhagavad-gita"]],
  ["marcus-aurelius", [...meditations, ...marcusLetters], marcusSource],
  ["rumi", [...masnavi, ...divan], { ...sources.rumi, source_urls: [...sources.rumi.source_urls, sources["rumi-divan"].source_url] }],
  ["camus", camusReflections, camusSource],
];

const corpus = [];
const audits = {};
for (const [key, rows, source] of grouped) {
  const tagged = rows.map((row) => tagQuote(row, vocabulary));
  const result = validateRows(tagged, source, vocabulary);
  if (result.accepted.length !== rows.length) {
    const rejected = result.audit.filter((record) => record.status === "rejected");
    throw new Error(`${key}: rejected ${JSON.stringify(rejected.slice(0, 10))}`);
  }
  corpus.push(...result.accepted);
  audits[key] = { accepted: result.accepted.length, rejected: 0 };
}

const expectedCounts = { "bhagavad-gita": 110, buddha: 110, camus: 60, "marcus-aurelius": 65, rumi: 50 };
for (const [slug, expected] of Object.entries(expectedCounts)) {
  const actual = corpus.filter((row) => row.guide_slug === slug).length;
  if (actual !== expected) throw new Error(`${slug}: expected ${expected}, received ${actual}`);
}

const migrationHeader = `-- Approved multi-source passage corpus.\n-- Existing rows are archived rather than deleted so journal references remain valid.\n\nalter table public.quotes\n  add column if not exists content_type text not null default 'direct_quote',\n  add column if not exists source_work text,\n  add column if not exists source_url text,\n  add column if not exists translator text,\n  add column if not exists rights_basis text,\n  add column if not exists archived_at timestamptz;\n\ndo $$\nbegin\n  if not exists (\n    select 1 from pg_constraint\n    where conname = 'quotes_content_type_check'\n      and conrelid = 'public.quotes'::regclass\n  ) then\n    alter table public.quotes\n      add constraint quotes_content_type_check\n      check (content_type in ('direct_quote', 'paraphrase', 'source_based_reflection'));\n  end if;\nend\n$$;\n\ncreate index if not exists idx_quotes_active_guide_created\n  on public.quotes (guide_id, created_at desc, id desc)\n  where archived_at is null;\n\nupdate public.quotes\nset archived_at = coalesce(archived_at, now());\n\n`;
const migrationFooter = `\n-- Keep public reading access explicit while RLS remains the row-level boundary.\ngrant select on table public.quotes to anon, authenticated;\n`;
const migrationSql = `${migrationHeader}${generateSeedSql(corpus)}${migrationFooter}`;

await mkdir(workDirectory, { recursive: true });
async function writeAtomic(path, content) {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, content, "utf8");
  await rename(temporaryPath, path);
}
await Promise.all([
  writeAtomic(join(workDirectory, "approved-corpus.json"), `${JSON.stringify(corpus, null, 2)}\n`),
  writeAtomic(join(workDirectory, "approved-corpus.audit.json"), `${JSON.stringify({ counts: expectedCounts, sources: audits, total: corpus.length }, null, 2)}\n`),
  writeAtomic(migrationPath, migrationSql),
]);
process.stdout.write(`${JSON.stringify({ counts: expectedCounts, migrationPath, total: corpus.length })}\n`);
