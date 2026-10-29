import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ActivityModel } from "../src/models/activity.model.js";
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

function itemBody(title: string, extra: Record<string, unknown> = {}) {
  return {
    title,
    description: "A black item with a small scratch and a campus sticker.",
    type: "lost",
    category: "Electronics",
    location: "Library entrance",
    eventDate: new Date().toISOString(),
    contactPreference: "in_app",
    ...extra,
  };
}

describe("items", () => {
  it("validates item creation", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(studentInput);
    const response = await agent.post("/api/items").send({ title: "x" });
    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("searches approved items with pagination", async () => {
    const student = request.agent(app);
    await student.post("/api/auth/register").send(studentInput);
    const first = await student.post("/api/items").send(itemBody("Black earbuds"));
    const second = await student.post("/api/items").send(itemBody("Silver calculator"));
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    expect(second.status, JSON.stringify(second.body)).toBe(201);

    const hidden = await request(app).get("/api/items?q=earbuds");
    expect(hidden.body.data).toEqual([]);

    const { agent: admin } = await loginAdmin(app);
    const denied = await student.patch(`/api/admin/items/${first.body.data.id}/moderation`).send({
      action: "approve",
    });
    expect(denied.status).toBe(403);

    expect(
      (await admin.patch(`/api/admin/items/${first.body.data.id}/moderation`).send({ action: "approve" })).status,
    ).toBe(200);
    expect(
      (await admin.patch(`/api/admin/items/${second.body.data.id}/moderation`).send({ action: "approve" })).status,
    ).toBe(200);

    const page = await request(app).get("/api/items").query({ q: "black", limit: 1, page: 1 });
    expect(page.status).toBe(200);
    expect(page.body.data).toHaveLength(1);
    expect(page.body.pagination.total).toBe(2);
    expect(page.body.pagination.totalPages).toBe(2);
    expect(page.body.data[0].identifyingDetails).toBeUndefined();

    const audit = await ActivityModel.find({ action: "item.moderated" });
    expect(audit.length).toBe(2);
    expect(audit[0]?.metadata).not.toHaveProperty("password");
  });
});
