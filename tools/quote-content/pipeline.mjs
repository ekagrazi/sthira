import { createHash } from "node:crypto";

const MAX_QUOTE_CHARACTERS = 500;
const CONTENT_TYPES = ["direct_quote", "paraphrase", "source_based_reflection"];

const keywordRules = [
  { keywords: ["peace", "quiet", "calm", "tranquil"], mood_tags: ["anxious", "restless"], themes: ["peace"] },
  { keywords: ["anger", "hatred", "wrath", "resent"], mood_tags: ["angry", "frustrated"], themes: ["forgiveness"] },
  { keywords: ["duty", "work", "action", "act", "effort"], mood_tags: ["stuck", "unmotivated"], themes: ["action", "purpose"] },
  { keywords: ["fear", "courage", "strength", "endure"], mood_tags: ["fearful", "insecure"], themes: ["resilience"] },
  { keywords: ["grief", "sorrow", "loss", "wound", "pain"], mood_tags: ["grieving", "low"], themes: ["healing"] },
  { keywords: ["mind", "thought", "wisdom", "know", "truth"], mood_tags: ["confused", "overwhelmed"], themes: ["clarity", "perspective"] },
  { keywords: ["love", "friend", "heart", "compassion"], mood_tags: ["guilty", "tired"], themes: ["love", "support"] },
  { keywords: ["present", "today", "moment", "now"], mood_tags: ["anxious", "overwhelmed"], themes: ["presence"] },
  { keywords: ["change", "passing", "impermanent", "vanish"], mood_tags: ["grieving", "fearful"], themes: ["impermanence", "acceptance"] },
  { keywords: ["desire", "attachment", "possess", "fruit"], mood_tags: ["discontent", "restless"], themes: ["detachment"] },
  { keywords: ["practice", "discipline", "restrain", "control"], mood_tags: ["unmotivated", "stuck"], themes: ["discipline", "practice"] },
  { keywords: ["control", "restrain", "self-command", "self-mastery", "master of", "govern", "within our power", "in our power"], mood_tags: ["frustrated", "overwhelmed"], themes: ["control"] },
  { keywords: ["patience", "patient", "patiently", "forbear", "forbearance", "long-suffering", "silently shall i endure", "endures reproach"], mood_tags: ["anxious", "restless"], themes: ["patience"] },
  { keywords: ["alone", "together", "solidarity", "others"], mood_tags: ["low", "insecure"], themes: ["connection", "support"] },
  { keywords: ["hope", "light", "dawn", "rise"], mood_tags: ["low", "tired"], themes: ["hope"] },
];

const guideFallbacks = {
  "bhagavad-gita": { mood_tags: ["lost"], themes: ["purpose"] },
  buddha: { mood_tags: ["anxious"], themes: ["peace"] },
  camus: { mood_tags: ["low"], themes: ["resilience"] },
  "marcus-aurelius": { mood_tags: ["discontent"], themes: ["perspective"] },
  rumi: { mood_tags: ["grieving"], themes: ["healing"] },
};

export function normalizeWhitespace(value) {
  return String(value).normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function decodeHtml(value) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&#8212;|&mdash;/giu, "—")
    .replace(/&#8216;|&#8217;|&rsquo;|&lsquo;/giu, "'")
    .replace(/&acirc;/giu, "â")
    .replace(/&icirc;/giu, "î")
    .replace(/&acirc;/giu, "â");
}

function stringArray(value) {
  return Array.isArray(value) ? value.map(normalizeWhitespace).filter(Boolean) : [];
}

function sourceRow(source, values) {
  return {
    citation: values.citation,
    content_type: values.content_type ?? "direct_quote",
    guide_slug: source.guide_slug,
    mood_tags: values.mood_tags ?? [],
    rights_basis: values.rights_basis ?? source.rights,
    source_url: values.source_url ?? source.source_url,
    source_work: values.source_work ?? source.source_work,
    text: values.text,
    themes: values.themes ?? [],
    translator: values.translator ?? source.translator ?? null,
  };
}

function stripHtml(value) {
  return normalizeWhitespace(decodeHtml(value.replace(/<br\s*\/?>/giu, "\n")))
    .replace(/\s+([,.;!?])/gu, "$1");
}

function splitSourceDocuments(rawText) {
  const marker = /<!-- STHIRA_SOURCE (\d+) (https:\/\/[^\s]+) -->\s*/gu;
  const matches = [...rawText.matchAll(marker)];
  if (matches.length === 0) return [{ index: 1, text: rawText, url: null }];
  return matches.map((match, index) => ({
    index: Number(match[1]),
    text: rawText.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? rawText.length),
    url: match[2],
  }));
}

const bookNumbers = new Map([
  ["FIRST", 1], ["SECOND", 2], ["THIRD", 3], ["FOURTH", 4], ["FIFTH", 5], ["SIXTH", 6],
  ["SEVENTH", 7], ["EIGHTH", 8], ["NINTH", 9], ["TENTH", 10], ["ELEVENTH", 11], ["TWELFTH", 12],
]);

function romanToInteger(value) {
  const numerals = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    const current = numerals[value[index]] ?? 0;
    const next = numerals[value[index + 1]] ?? 0;
    total += current < next ? -current : current;
  }
  return total;
}

export function parseSourceText(source, rawText) {
  if (source.parser === "curated-json") {
    const records = JSON.parse(rawText);
    if (!Array.isArray(records)) throw new Error("Curated input must be a JSON array.");
    return records.map((record) => sourceRow(source, {
      ...record,
      mood_tags: stringArray(record?.mood_tags),
      themes: stringArray(record?.themes),
    }));
  }

  if (source.parser === "numbered-verses") {
    const plainText = decodeHtml(rawText).replace(/\r\n?/gu, "\n");
    const pattern = /(?:^|\n)\s*(\d{1,4})\.\s+([\s\S]*?)(?=\n\s*\d{1,4}\.\s+|$)/gu;
    return [...plainText.matchAll(pattern)].map((match) => sourceRow(source, {
      citation: `${source.citation_prefix} ${match[1]}`,
      text: match[2],
    }));
  }

  if (source.parser === "sacred-texts-gita") {
    return splitSourceDocuments(rawText).flatMap((document) => {
      const beforeFootnotes = document.text.split(/<h3[^>]*>\s*footnotes\s*<\/h3>/iu)[0] ?? "";
      const paragraphs = [...beforeFootnotes.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/giu)];
      const verses = [];
      let current = null;
      for (const paragraph of paragraphs) {
        const withoutLinks = paragraph[1].replace(/<a\b[^>]*>[\s\S]*?<\/a>/giu, " ");
        const text = stripHtml(withoutLinks);
        if (!text || /^p\.\s*\d+$/iu.test(text) || /^(?:Sanjaya|Arjuna|The Blessed Lord|Dhritarashtra) said:?$/iu.test(text)) continue;
        if (/^The end of/iu.test(text)) break;
        const start = text.match(/^(\d+(?:-\d+)?)\.\s+([\s\S]+)$/u);
        if (start) {
          if (current) verses.push(current);
          current = { number: start[1], text: start[2] };
        } else if (current) {
          current.text = `${current.text} ${text}`;
        }
      }
      if (current) verses.push(current);
      return verses.map((verse) => sourceRow(source, {
        citation: `${source.citation_prefix} ${document.index}.${verse.number}`,
        source_url: document.url ?? source.source_url,
        text: verse.text,
      }));
    });
  }

  if (source.parser === "meditations") {
    const start = rawText.indexOf("THE FIRST BOOK");
    const end = rawText.indexOf("APPENDIX", start);
    const body = rawText.slice(start, end > start ? end : undefined);
    const books = [...body.matchAll(/^THE (FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH) BOOK\s*$/gmu)];
    return books.flatMap((bookMatch, bookIndex) => {
      const book = bookNumbers.get(bookMatch[1]);
      const section = body.slice((bookMatch.index ?? 0) + bookMatch[0].length, books[bookIndex + 1]?.index ?? body.length);
      const entries = [...section.matchAll(/^([IVXLCDM]+)\.\s+([\s\S]*?)(?=^[IVXLCDM]+\.\s+|(?![\s\S]))/gmu)];
      return entries.flatMap((entry) => {
        const citation = `${source.citation_prefix} ${book}.${romanToInteger(entry[1])}`;
        return normalizeWhitespace(entry[2])
          .split(/(?<=[.!?])\s+(?=[A-Z])/u)
          .map(normalizeWhitespace)
          .filter((text) => text.length >= 45 && text.length <= MAX_QUOTE_CHARACTERS)
          .map((text) => sourceRow(source, { citation, text }));
      });
    });
  }

  if (source.parser === "masnavi") {
    return splitSourceDocuments(rawText).flatMap((document) => {
      const contentStart = document.text.indexOf('id="mw-content-text"');
      const content = document.text.slice(contentStart >= 0 ? contentStart : 0);
      const headings = [...content.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/giu)];
      return headings.flatMap((heading, headingIndex) => {
        const title = stripHtml(heading[1]).replace(/\[edit\]$/iu, "");
        const section = content.slice((heading.index ?? 0) + heading[0].length, headings[headingIndex + 1]?.index ?? content.length);
        const paragraphs = [...section.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/giu)];
        return paragraphs.flatMap((paragraph) => {
          if ((paragraph[1].match(/<br\s*\/?>/giu) ?? []).length < 3) return [];
          const lines = decodeHtml(paragraph[1].replace(/<br\s*\/?>/giu, "\n"))
            .split(/\n/gu)
            .map(normalizeWhitespace)
            .filter((line) => line.length >= 18 && line.length <= 220)
            .filter((line) => !/^(?:NOTES?|\d+\.)/iu.test(line));
          const rows = [];
          for (let index = 0; index + 1 < lines.length; index += 2) {
            rows.push(sourceRow(source, {
              citation: `Masnavi, Book ${document.index}, ${title}`,
              source_url: document.url ?? source.source_url,
              text: `${lines[index]} ${lines[index + 1]}`,
            }));
          }
          return rows;
        });
      });
    });
  }

  if (source.parser === "divan") {
    const lines = rawText.split(/\r?\n/gu).map(normalizeWhitespace);
    const start = lines.findIndex((line) => /If thou art Love.s lover and seekest Love/iu.test(line));
    const endOffset = lines.slice(start + 1).findIndex((line) => line === "NOTES.");
    const end = endOffset >= 0 ? start + 1 + endOffset : lines.length;
    const commonWords = /\b(?:the|and|of|to|in|is|that|thou|thy|thee|with|for|not|what|who|love|heart|from|this|my|our|all|no|be|are|hath|shall)\b/giu;
    let page = 1;
    let run = [];
    const candidates = [];
    function flush() {
      for (let index = 0; index + 1 < run.length; index += 2) {
        candidates.push(sourceRow(source, {
          citation: `Divan-e Shams, Nicholson selection, p. ${page}`,
          text: `${run[index]} ${run[index + 1]}`,
        }));
      }
      run = [];
    }
    for (const line of lines.slice(Math.max(0, start), end)) {
      if (/^\d{1,3}$/u.test(line) && Number(line) <= 195) {
        flush();
        page = Number(line);
        continue;
      }
      const words = line.match(commonWords)?.length ?? 0;
      const letters = line.match(/[A-Za-z]/gu)?.length ?? 0;
      const isEnglish = line.length >= 20 && line.length <= 140 && words >= 2 && letters / line.length >= 0.55;
      if (isEnglish) run.push(line);
      else flush();
    }
    flush();
    return candidates;
  }

  throw new Error(`Unsupported parser: ${String(source.parser)}`);
}

export function tagQuote(row, vocabulary) {
  const normalizedText = normalizeWhitespace(row.text).toLocaleLowerCase("en");
  const matchedRules = keywordRules.filter((rule) => rule.keywords.some((keyword) => normalizedText.includes(keyword)));
  const fallback = guideFallbacks[row.guide_slug];
  const themes = row.themes?.length ? stringArray(row.themes) : [...new Set(matchedRules.flatMap((rule) => rule.themes))];
  const moodTags = row.mood_tags?.length ? stringArray(row.mood_tags) : [...new Set(matchedRules.flatMap((rule) => rule.mood_tags))];
  const normalizedThemes = themes.length ? themes : [...(fallback?.themes ?? [])];
  const normalizedMoodTags = moodTags.length ? moodTags : [...(fallback?.mood_tags ?? [])];
  return {
    ...row,
    mood_tags: normalizedMoodTags,
    themes: normalizedThemes,
    vocabulary_valid: normalizedThemes.every((theme) => vocabulary.quote_themes.includes(theme)) && normalizedMoodTags.every((tag) => vocabulary.mood_tags.includes(tag)),
  };
}

export function validateRows(rows, source, vocabulary) {
  const accepted = [];
  const audit = [];
  const seenText = new Set();
  const allowedSourceUrls = new Set([source.source_url, ...(source.source_urls ?? [])]);
  for (const row of rows) {
    const text = normalizeWhitespace(row?.text ?? "");
    const citation = normalizeWhitespace(row?.citation ?? "");
    const themes = [...new Set(stringArray(row?.themes))];
    const moodTags = [...new Set(stringArray(row?.mood_tags))];
    const contentType = normalizeWhitespace(row?.content_type ?? "");
    const sourceWork = normalizeWhitespace(row?.source_work ?? "");
    const sourceUrl = normalizeWhitespace(row?.source_url ?? "");
    const rightsBasis = normalizeWhitespace(row?.rights_basis ?? "");
    let reason = null;
    if (!text || !citation) reason = "empty_text_or_citation";
    else if (text.length > MAX_QUOTE_CHARACTERS) reason = "oversized_text";
    else if (seenText.has(text.toLocaleLowerCase("en"))) reason = "duplicate_text";
    else if (row?.guide_slug !== source.guide_slug) reason = "invalid_guide_slug";
    else if (!allowedSourceUrls.has(sourceUrl)) reason = "invalid_source_url";
    else if (!sourceWork || !rightsBasis) reason = "missing_provenance";
    else if (!CONTENT_TYPES.includes(contentType)) reason = "invalid_content_type";
    else if (themes.length === 0 || moodTags.length === 0) reason = "missing_tags";
    else if (!themes.every((theme) => vocabulary.quote_themes.includes(theme))) reason = "unknown_theme";
    else if (!moodTags.every((tag) => vocabulary.mood_tags.includes(tag))) reason = "unknown_mood_tag";
    audit.push({ citation: citation || null, reason, source_url: sourceUrl, status: reason ? "rejected" : "accepted" });
    if (reason) continue;
    seenText.add(text.toLocaleLowerCase("en"));
    accepted.push({
      citation,
      content_type: contentType,
      guide_slug: source.guide_slug,
      mood_tags: moodTags,
      rights_basis: rightsBasis,
      source_url: sourceUrl,
      source_work: sourceWork,
      text,
      themes,
      translator: row?.translator ? normalizeWhitespace(row.translator) : null,
    });
  }
  return { accepted, audit };
}

export async function runBounded(items, concurrency, worker) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error("Concurrency must be an integer from 1 to 4.");
  const results = new Array(items.length);
  let nextIndex = 0;
  async function consume() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => consume()));
  return results;
}

export function deterministicQuoteId(row) {
  const digest = createHash("sha256").update(`${row.guide_slug}\u0000${row.citation}\u0000${row.text}`).digest("hex").slice(0, 32).split("");
  digest[12] = "4";
  digest[16] = ["8", "9", "a", "b"][Number.parseInt(digest[16], 16) % 4];
  const value = digest.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlArray(values) {
  return `array[${values.map(sqlLiteral).join(", ")}]::text[]`;
}

export function generateSeedSql(rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("At least one prepared quote is required.");
  const statements = [];
  for (let start = 0; start < rows.length; start += 25) {
    const values = rows.slice(start, start + 25).map((row) =>
      `  (${sqlLiteral(deterministicQuoteId(row))}, (select id from public.guides where slug = ${sqlLiteral(row.guide_slug)}), ${sqlLiteral(row.text)}, ${sqlLiteral(row.citation)}, ${sqlArray(row.themes)}, ${sqlArray(row.mood_tags)}, ${sqlLiteral(row.content_type)}, ${sqlLiteral(row.source_work)}, ${sqlLiteral(row.source_url)}, ${row.translator ? sqlLiteral(row.translator) : "null"}, ${sqlLiteral(row.rights_basis)}, null)`,
    );
    statements.push([
      "insert into public.quotes (id, guide_id, text, citation, themes, mood_tags, content_type, source_work, source_url, translator, rights_basis, archived_at)",
      "values",
      values.join(",\n"),
      "on conflict (id) do update",
      "set",
      "  guide_id = excluded.guide_id,",
      "  text = excluded.text,",
      "  citation = excluded.citation,",
      "  themes = excluded.themes,",
      "  mood_tags = excluded.mood_tags,",
      "  content_type = excluded.content_type,",
      "  source_work = excluded.source_work,",
      "  source_url = excluded.source_url,",
      "  translator = excluded.translator,",
      "  rights_basis = excluded.rights_basis,",
      "  archived_at = null;",
    ].join("\n"));
  }
  return `${statements.join("\n\n")}\n`;
}

export { MAX_QUOTE_CHARACTERS };
