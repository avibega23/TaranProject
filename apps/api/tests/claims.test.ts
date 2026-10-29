import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { clearDatabase, loginAdmin, startMemoryDatabase, stopMemoryDatabase, studentInput } from "./helpers.js";

const app = createApp();

beforeAll(async () => {
  await startMemoryDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await stopMemoryDatabase();
});

async function register(email: string, studentId: string) {
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/register").send({
    ...studentInput,
    email,
    studentId,
    name: email.split("@")[0],
  });
  expect(response.status).toBe(201);
  return agent;
}

describe("matches and claims", () => {
  it("returns an explainable match for the opposite report type", async () => {
    const owner = await register("owner@campus.example", "EN1001");
    const finder = await register("finder@campus.example", "EN1002");
    const lost = await owner.post("/api/items").send({
      title: "Black wireless earbuds",
      description: "Black earbuds with a scratched charging case",
      type: "lost",
      category: "Electronics",
      location: "Library entrance",
      eventDate: new Date().toISOString(),
      contactPreference: "in_app",
    });
    const found = await finder.post("/api/items").send({
      title: "Black earbuds in a charging case",
      description: "Found black earbuds near the library entrance notice board",
      type: "found",
      category: "Electronics",
      location: "Library entrance",
      eventDate: new Date().toISOString(),
      contactPreference: "in_app",
    });
    const { agent: admin } = await loginAdmin(app);
    await admin.patch(`/api/admin/items/${lost.body.data.id}/moderation`).send({ action: "approve" });
    await admin.patch(`/api/admin/items/${found.body.data.id}/moderation`).send({ action: "approve" });

    const matches = await owner.get(`/api/items/${lost.body.data.id}/matches`);
    expect(matches.status).toBe(200);
    expect(matches.body.data[0].item.id).toBe(found.body.data.id);
    expect(matches.body.data[0].score).toBeGreaterThan(0.35);
    expect(matches.body.data[0].reasons.length).toBeGreaterThan(0);
  });

  it("blocks duplicate claims, self approval, and illegal status changes", async () => {
    const finder = await register("finder2@campus.example", "EN2002");
    const claimant = await register("claimant@campus.example", "EN2003");
    const found = await finder.post("/api/items").send({
      title: "Student ID card",
      description: "Campus identification card found on a table",
      type: "found",
      category: "ID Cards",
      location: "Main library",
      eventDate: new Date().toISOString(),
      contactPreference: "in_app",
    });
    const { agent: admin } = await loginAdmin(app);
    await admin.patch(`/api/admin/items/${found.body.data.id}/moderation`).send({ action: "approve" });

    const selfClaim = await finder.post(`/api/items/${found.body.data.id}/claims`).send({
      explanation: "I reported this card and should not claim it.",
    });
    expect(selfClaim.status).toBe(403);

    const claim = await claimant.post(`/api/items/${found.body.data.id}/claims`).send({
      explanation: "The photo and enrollment number match my card.",
      proofDescription: "Private card number ending in 42.",
    });
    expect(claim.status).toBe(201);
    const duplicate = await claimant.post(`/api/items/${found.body.data.id}/claims`).send({
      explanation: "Submitting the same claim a second time today.",
    });
    expect(duplicate.status).toBe(409);

    const outsider = await request(app).get(`/api/claims/${claim.body.data.id}`);
    expect(outsider.status).toBe(401);
    const other = await register("other@campus.example", "EN2004");
    const hidden = await other.get(`/api/claims/${claim.body.data.id}`);
    expect(hidden.status).toBe(403);

    const selfReview = await claimant.patch(`/api/claims/${claim.body.data.id}/review`).send({
      decision: "approve",
    });
    expect(selfReview.status).toBe(403);

    const approved = await finder.patch(`/api/claims/${claim.body.data.id}/review`).send({
      decision: "approve",
      note: "Details matched.",
    });
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe("approved");

    const cancelled = await claimant.patch(`/api/claims/${claim.body.data.id}/cancel`);
    expect(cancelled.status).toBe(409);

    const item = await request(app).get(`/api/items/${found.body.data.id}`);
    expect(item.body.data.status).toBe("resolved");
    expect(JSON.stringify(item.body)).not.toContain("Private card number");
  });
});
