import { z } from "zod";

const weight = z.coerce.number().min(0).max(1);

const matchingSchema = z.object({
  weights: z.object({
    category: weight.default(0.35),
    text: weight.default(0.35),
    location: weight.default(0.15),
    date: weight.default(0.15),
  }),
  dateWindowDays: z.coerce.number().positive().default(14),
  minScore: z.coerce.number().min(0).max(1).default(0.35),
  candidateLimit: z.coerce.number().int().positive().max(200).default(80),
  resultLimit: z.coerce.number().int().positive().max(20).default(8),
});

export type MatchingConfig = z.infer<typeof matchingSchema>;

export function getMatchingConfig(): MatchingConfig {
  return matchingSchema.parse({
    weights: {
      category: process.env.MATCH_WEIGHT_CATEGORY,
      text: process.env.MATCH_WEIGHT_TEXT,
      location: process.env.MATCH_WEIGHT_LOCATION,
      date: process.env.MATCH_WEIGHT_DATE,
    },
    dateWindowDays: process.env.MATCH_DATE_WINDOW_DAYS,
    minScore: process.env.MATCH_MIN_SCORE,
    candidateLimit: process.env.MATCH_CANDIDATE_LIMIT,
    resultLimit: process.env.MATCH_RESULT_LIMIT,
  });
}
