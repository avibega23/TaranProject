import bcrypt from "bcryptjs";
import { getEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { createSessionToken, hashSessionToken } from "../utils/tokens.js";
import { UserRepository, type UserRecord } from "../repositories/user.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { ActivityRepository } from "../repositories/activity.repository.js";

const users = new UserRepository();
const sessions = new SessionRepository();
const activity = new ActivityRepository();

export type AuthResult = {
  user: UserRecord;
  token: string;
};

function assertCollegeEmail(email: string): void {
  const domain = getEnv().COLLEGE_EMAIL_DOMAIN.trim().toLowerCase().replace(/^@/, "");
  if (!domain) return;
  if (!email.endsWith(`@${domain}`)) {
    throw new AppError(422, "VALIDATION_ERROR", `Use your college email ending in @${domain}.`);
  }
}

export async function registerStudent(input: {
  name: string;
  email: string;
  studentId: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const studentId = input.studentId.trim().toUpperCase();
  assertCollegeEmail(email);

  const existingEmail = await users.findByEmail(email);
  if (existingEmail) {
    throw new AppError(409, "CONFLICT", "An account with this email already exists.");
  }
  const existingStudent = await users.findByStudentId(studentId);
  if (existingStudent) {
    throw new AppError(409, "CONFLICT", "An account with this student ID already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, getEnv().BCRYPT_ROUNDS);
  const user = await users.create({
    name: input.name.trim(),
    email,
    studentId,
    passwordHash,
    role: "student",
  });
  await activity.create({
    actorId: user.id,
    action: "user.registered",
    resourceType: "user",
    resourceId: user.id,
    metadata: { role: "student" },
  });
  return createLoginSession(user);
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const user = await users.findByEmail(email, true);
  const matches = user?.passwordHash
    ? await bcrypt.compare(input.password, user.passwordHash)
    : false;
  if (!user || !matches) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid email or password.");
  }
  if (user.accountStatus !== "active") {
    throw new AppError(403, "FORBIDDEN", "This account cannot sign in.");
  }
  return createLoginSession(user);
}

export async function logout(token: string | undefined): Promise<void> {
  if (!token) return;
  await sessions.deleteByHash(hashSessionToken(token));
}

export async function getUserForToken(token: string | undefined): Promise<UserRecord | null> {
  if (!token) return null;
  const session = await sessions.findValidByHash(hashSessionToken(token));
  if (!session) return null;
  const user = await users.findById(session.userId);
  if (!user || user.accountStatus !== "active") return null;
  return user;
}

export async function updateProfile(userId: string, name: string): Promise<UserRecord> {
  const updated = await users.updateName(userId, name.trim());
  if (!updated) throw new AppError(404, "NOT_FOUND", "Account not found.");
  return updated;
}

async function createLoginSession(user: UserRecord): Promise<AuthResult> {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + getEnv().SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await sessions.create({
    userId: user.id,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });
  return { user, token };
}
