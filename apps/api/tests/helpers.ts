import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import type { Express } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../src/models/user.model.js";

let memory: MongoMemoryReplSet | null = null;

export async function startMemoryDatabase(): Promise<void> {
  memory = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  await mongoose.connect(memory.getUri());
}

export async function stopMemoryDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memory) await memory.stop();
  memory = null;
}

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
}

export async function loginAdmin(app: Express) {
  const password = "Admin-pass-123";
  const passwordHash = await bcrypt.hash(password, 4);
  await UserModel.create({
    name: "Campus Admin",
    email: "admin@campus.example",
    studentId: "ADMIN",
    passwordHash,
    role: "admin",
    accountStatus: "active",
  });
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/login").send({
    email: "admin@campus.example",
    password,
  });
  return { agent, response };
}

export const studentInput = {
  name: "Asha Menon",
  email: "asha.menon@campus.example",
  studentId: "EN2023001",
  password: "student-pass-123",
  confirmPassword: "student-pass-123",
};
