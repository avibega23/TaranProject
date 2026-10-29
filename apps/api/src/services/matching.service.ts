import { getMatchingConfig, type MatchingConfig } from "../config/matching.js";
import { ItemRepository, type ItemRecord } from "../repositories/item.repository.js";
import { jaccard, tokenize } from "../utils/text.js";
import { getItemForViewer } from "./item.service.js";
import type { Role } from "../config/constants.js";
import { AppError } from "../utils/errors.js";

const items = new ItemRepository();

export type ScoreInput = {
  title: string;
  description: string;
  category: string;
  location: string;
  eventDate: Date;
};

export type ScoreResult = {
  score: number;
  reasons: string[];
  sharedKeywords: string[];
};

export function scoreMatch(
  source: ScoreInput,
  candidate: ScoreInput,
  config: MatchingConfig = getMatchingConfig(),
): ScoreResult | null {
  const categoryScore = source.category === candidate.category ? 1 : 0;
  const sourceTokens = tokenize(`${source.title} ${source.description}`);
  const candidateTokens = tokenize(`${candidate.title} ${candidate.description}`);
  const textScore = jaccard(sourceTokens, candidateTokens);
  const locationScore = jaccard(tokenize(source.location), tokenize(candidate.location));
  const daysApart =
    Math.abs(source.eventDate.getTime() - candidate.eventDate.getTime()) / (24 * 60 * 60 * 1000);
  const dateScore =
    daysApart > config.dateWindowDays ? 0 : 1 - daysApart / config.dateWindowDays;

  const raw =
    config.weights.category * categoryScore +
    config.weights.text * textScore +
    config.weights.location * locationScore +
    config.weights.date * dateScore;
  const score = Math.round(raw * 100) / 100;
  if (score < config.minScore) return null;

  const sharedKeywords = sourceTokens.filter((token) => candidateTokens.includes(token)).slice(0, 8);
  const reasons: string[] = [];
  if (categoryScore === 1) reasons.push(`Same category: ${source.category}`);
  if (sharedKeywords.length > 0) reasons.push(`Shared words: ${sharedKeywords.join(", ")}`);
  if (locationScore > 0) reasons.push("Locations use similar words");
  if (dateScore > 0) {
    const rounded = Math.round(daysApart);
    reasons.push(`Dates are ${rounded} day${rounded === 1 ? "" : "s"} apart`);
  }
  reasons.push("This score is a heuristic similarity estimate, not a probability of recovery.");
  return { score, reasons, sharedKeywords };
}

export async function findMatches(itemId: string, viewer: { id: string; role: Role } | null) {
  const source = await getItemForViewer(itemId, viewer);
  if (source.status === "resolved" || source.status === "rejected" || source.status === "archived") {
    return [];
  }
  if (source.status !== "approved" && source.status !== "pending") {
    return [];
  }
  const config = getMatchingConfig();
  const windowMs = config.dateWindowDays * 2 * 24 * 60 * 60 * 1000;
  const candidates = await items.findMatchCandidates({
    type: source.type === "lost" ? "found" : "lost",
    excludeId: source.id,
    category: source.category,
    from: new Date(source.eventDate.getTime() - windowMs),
    to: new Date(source.eventDate.getTime() + windowMs),
    limit: config.candidateLimit,
  });

  return candidates
    .map((candidate) => {
      const scored = scoreMatch(source, candidate, config);
      if (!scored) return null;
      return { item: candidate, ...scored };
    })
    .filter((entry): entry is { item: ItemRecord } & ScoreResult => entry !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, config.resultLimit);
}

export function assertMatchable(item: ItemRecord): void {
  if (item.status !== "approved") {
    throw new AppError(409, "CONFLICT", "Matches are available after a report is approved.");
  }
}
