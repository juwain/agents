import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { POLICIES, type PolicyChunk } from "../data/policies.js";

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they",
  "them", "their", "this", "that", "these", "those", "what", "which",
  "who", "whom", "when", "where", "why", "how", "all", "any", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "not",
  "only", "same", "so", "than", "too", "very", "just", "but", "and",
  "or", "if", "in", "on", "at", "to", "for", "of", "with", "by", "from",
  "up", "about", "into", "through", "during", "before", "after", "above",
  "below", "between", "out", "off", "over", "under", "again", "then",
  "once", "here", "there", "am", "also", "as",
]);

const SCORE_THRESHOLD = 4;

function keywordScore(query: string, chunk: PolicyChunk): number {
  const words = new Set(
    query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => !STOP_WORDS.has(w))
  );
  const text = (chunk.title + " " + chunk.content).toLowerCase();
  let score = 0;
  for (const w of words) {
    if (text.includes(w)) score++;
  }
  return score;
}

export const lookupPolicy = tool(
  async ({ query }) => {
    console.log(`[TOOL] lookup_policy(query='${query}')`);

    const scored = POLICIES.map((chunk) => ({
      chunk,
      score: keywordScore(query, chunk),
    }));

    const hits = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    for (const { chunk, score } of hits) {
      const marker = score >= SCORE_THRESHOLD ? "\u2705" : "\u274C";
      console.log(`  ${marker} [${score}] ${chunk.title}`);
    }

    const relevant = hits
      .filter((s) => s.score >= SCORE_THRESHOLD)
      .slice(0, 2);

    if (relevant.length === 0) {
      console.log(
        `[TOOL] lookup_policy → no results above threshold (${SCORE_THRESHOLD})`
      );
      return "No relevant policy documents found.";
    }

    const titles = relevant.map((r) => r.chunk.title);
    console.log(`[TOOL] lookup_policy → found: ${JSON.stringify(titles)}`);

    return relevant
      .map((r) => `### ${r.chunk.title}\n${r.chunk.content}`)
      .join("\n\n");
  },
  {
    name: "lookup_policy",
    description:
      "Search the airline policy handbook for information relevant to the query.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query describing the topic or situation"),
    }),
  }
);
