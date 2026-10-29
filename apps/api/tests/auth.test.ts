import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { UserModel } from "../src/models/user.model.js";
import { clearDatabase, startMemoryDatabase, stopMemoryDatabase, studentInput } from "./helpers.js";

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

describe("authentication", () => {
  it("rejects incomplete registration", async () => {
    const response = await request(app).post("/api/auth/register").send({ email: "not-an-email" });
    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("hashes passwords and ignores a requested admin role", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...studentInput, role: "admin" });
    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe("student");
    expect(response.body.data.user.passwordHash).toBeUndefined();

    const stored = await UserModel.findOne({ email: studentInput.email }).select("+passwordHash");
    expect(stored?.passwordHash).toBeTruthy();
    expect(stored?.passwordHash).not.toBe(studentInput.password);
    expect(await bcrypt.compare(studentInput.password, stored!.passwordHash)).toBe(true);
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/register").send(studentInput);
    const response = await request(app).post("/api/auth/register").send({
      ...studentInput,
      studentId: "EN2023999",
    });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe("CONFLICT");
  });

  it("signs in with a session cookie and rejects a bad password", async () => {
    await request(app).post("/api/auth/register").send(studentInput);
    const failure = await request(app).post("/api/auth/login").send({
      email: studentInput.email,
      password: "wrong-password",
    });
    expect(failure.status).toBe(401);
    expect(failure.body.message).toBe("Invalid email or password.");

    const agent = request.agent(app);
    const success = await agent.post("/api/auth/login").send({
      email: studentInput.email,
      password: studentInput.password,
    });
    expect(success.status).toBe(200);
    const cookie = success.headers["set-cookie"];
    expect(cookie?.join(";") ?? "").toContain("HttpOnly");
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(studentInput.email);
  });

  it("blocks anonymous and student access to protected admin data", async () => {
    const anonymous = await request(app).get("/api/dashboard/summary");
    expect(anonymous.status).toBe(401);

    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(studentInput);
    const dashboard = await agent.get("/api/dashboard/summary");
    expect(dashboard.status).toBe(200);
    const admin = await agent.get("/api/admin/overview");
    expect(admin.status).toBe(403);

    const escalation = await agent.patch("/api/users/me").send({ name: "Asha Menon", role: "admin" });
    expect(escalation.status).toBe(422);
    const me = await agent.get("/api/auth/me");
    expect(me.body.data.user.role).toBe("student");
  });
});
