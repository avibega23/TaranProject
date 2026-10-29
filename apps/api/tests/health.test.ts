import { beforeAll, afterAll, afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { clearDatabase, startMemoryDatabase, stopMemoryDatabase } from "./helpers.js";

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

describe("health", () => {
  it("reports a connected database", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: "ok", database: "connected" },
    });
  });
});
