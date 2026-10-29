import { describe, expect, it } from "vitest";
import { scoreMatch, type ScoreInput } from "../src/services/matching.service.js";
import type { MatchingConfig } from "../src/config/matching.js";

const config: MatchingConfig = {
  weights: { category: 0.35, text: 0.35, location: 0.15, date: 0.15 },
  dateWindowDays: 14,
  minScore: 0.35,
  candidateLimit: 80,
  resultLimit: 8,
};

function item(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    title: "Black wireless earbuds",
    description: "Black earbuds with a scratched charging case",
    category: "Electronics",
    location: "Library entrance",
    eventDate: new Date("2026-10-20T00:00:00.000Z"),
    ...overrides,
  };
}

describe("match scoring", () => {
  it("scores a close lost and found pair and explains the signals", () => {
    const result = scoreMatch(
      item(),
      item({
        title: "Black earbuds in a charging case",
        description: "Found black earbuds near the library entrance",
        eventDate: new Date("2026-10-21T00:00:00.000Z"),
      }),
      config,
    );
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0.7);
    expect(result!.reasons.join(" ")).toContain("Same category");
    expect(result!.reasons.join(" ")).toContain("heuristic similarity estimate");
    expect(result!.sharedKeywords).toContain("black");
  });

  it("drops pairs that do not share a meaningful signal", () => {
    const result = scoreMatch(
      item(),
      item({
        title: "Red umbrella",
        description: "Compact umbrella left on a chair",
        category: "Accessories",
        location: "Hostel gate",
        eventDate: new Date("2026-01-01T00:00:00.000Z"),
      }),
      config,
    );
    expect(result).toBeNull();
  });
});
