import bcrypt from "bcryptjs";
import { ActivityModel } from "../models/activity.model.js";
import { ClaimModel } from "../models/claim.model.js";
import { ItemModel } from "../models/item.model.js";
import { SessionModel } from "../models/session.model.js";
import { UserModel } from "../models/user.model.js";
import { connectDatabase, disconnectDatabase } from "./connect.js";
import { getEnv } from "../config/env.js";
import { buildSearchText } from "../utils/text.js";
import type { Category, ItemStatus, ItemType } from "../config/constants.js";

const clearOnly = process.argv.includes("--clear");

async function clearDemoData() {
  const demoUsers = await UserModel.find({ isDemo: true }).select("_id");
  const ids = demoUsers.map((user) => user._id);
  await SessionModel.deleteMany({ user: { $in: ids } });
  await ClaimModel.deleteMany({ isDemo: true });
  await ItemModel.deleteMany({ isDemo: true });
  await ActivityModel.deleteMany({ isDemo: true });
  await UserModel.deleteMany({ isDemo: true });
  console.log("Removed demo users, reports, claims, and activity. Administrator accounts were kept.");
}

async function upsertDemoUser(input: {
  name: string;
  email: string;
  studentId: string;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, getEnv().BCRYPT_ROUNDS);
  const user = await UserModel.findOneAndUpdate(
    { email: input.email },
    {
      $set: {
        name: input.name,
        email: input.email,
        studentId: input.studentId,
        passwordHash,
        role: "student",
        accountStatus: "active",
        isDemo: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return user;
}

async function ensureAdmin() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!name || !email || !password || password === "change-me-admin-password") {
    throw new Error(
      "Set ADMIN_NAME, ADMIN_EMAIL, and a real ADMIN_PASSWORD in apps/api/.env before seeding.",
    );
  }
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  const existing = await UserModel.findOne({ email });
  if (existing && existing.role !== "admin") {
    throw new Error("ADMIN_EMAIL already belongs to a student account. Choose a different email.");
  }
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, getEnv().BCRYPT_ROUNDS);
    await UserModel.create({
      name,
      email,
      studentId: "ADMIN",
      passwordHash,
      role: "admin",
      accountStatus: "active",
      isDemo: false,
    });
    console.log(`Created administrator ${email}`);
  } else {
    console.log(`Administrator ${email} already exists. Password was left unchanged.`);
  }
}

type DemoItem = {
  seedKey: string;
  title: string;
  description: string;
  type: ItemType;
  category: Category;
  location: string;
  daysAgo: number;
  status: ItemStatus;
  reporterEmail: string;
  identifyingDetails?: string;
};

const demoItems: DemoItem[] = [
  {
    seedKey: "seed-earbuds-lost",
    title: "Black wireless earbuds",
    description: "Black earbuds with a small charging case. The case has a scratch near the hinge.",
    type: "lost",
    category: "Electronics",
    location: "Library entrance",
    daysAgo: 3,
    status: "approved",
    reporterEmail: "asha.menon@campus.example",
    identifyingDetails: "Scratch on the hinge of the case.",
  },
  {
    seedKey: "seed-earbuds-found",
    title: "Black earbuds in a charging case",
    description: "Found black earbuds near the library entrance notice board. The case is scratched.",
    type: "found",
    category: "Electronics",
    location: "Library entrance",
    daysAgo: 2,
    status: "approved",
    reporterEmail: "rohan.iyer@campus.example",
  },
  {
    seedKey: "seed-bottle-lost",
    title: "Blue steel water bottle",
    description: "Matte blue bottle with a dent on the lid and a faded sticker.",
    type: "lost",
    category: "Water Bottles",
    location: "Cafeteria",
    daysAgo: 5,
    status: "approved",
    reporterEmail: "meera.shah@campus.example",
  },
  {
    seedKey: "seed-id-found",
    title: "Student ID card",
    description: "A campus ID card found on a reading room table. The photo is of a student.",
    type: "found",
    category: "ID Cards",
    location: "Main library reading room",
    daysAgo: 1,
    status: "approved",
    reporterEmail: "rohan.iyer@campus.example",
  },
  {
    seedKey: "seed-notebook-lost",
    title: "Calculus notebook",
    description: "Green notebook filled with calculus formulas. A name is written inside the cover.",
    type: "lost",
    category: "Books and Notes",
    location: "Lecture hall B",
    daysAgo: 1,
    status: "pending",
    reporterEmail: "asha.menon@campus.example",
    identifyingDetails: "Name written inside the front cover.",
  },
  {
    seedKey: "seed-keys-found",
    title: "Silver key ring",
    description: "Three silver keys on a plain ring, found by the hostel gate.",
    type: "found",
    category: "Keys",
    location: "Hostel gate",
    daysAgo: 12,
    status: "resolved",
    reporterEmail: "meera.shah@campus.example",
  },
  {
    seedKey: "seed-hoodie-lost",
    title: "Grey hoodie",
    description: "Grey hoodie left on a bench at the sports complex.",
    type: "lost",
    category: "Clothing",
    location: "Sports complex",
    daysAgo: 20,
    status: "rejected",
    reporterEmail: "rohan.iyer@campus.example",
  },
  {
    seedKey: "seed-bag-found",
    title: "Navy backpack",
    description: "Navy backpack with a laptop sleeve, found beside the auditorium steps.",
    type: "found",
    category: "Bags",
    location: "Auditorium steps",
    daysAgo: 4,
    status: "approved",
    reporterEmail: "asha.menon@campus.example",
  },
];

async function seedItems(password: string) {
  const asha = await upsertDemoUser({
    name: "Asha Menon",
    email: "asha.menon@campus.example",
    studentId: "EN2023001",
    password,
  });
  const rohan = await upsertDemoUser({
    name: "Rohan Iyer",
    email: "rohan.iyer@campus.example",
    studentId: "EN2023014",
    password,
  });
  const meera = await upsertDemoUser({
    name: "Meera Shah",
    email: "meera.shah@campus.example",
    studentId: "EN2023088",
    password,
  });
  const byEmail = new Map([
    [asha.email, asha],
    [rohan.email, rohan],
    [meera.email, meera],
  ]);

  for (const item of demoItems) {
    const reporter = byEmail.get(item.reporterEmail);
    if (!reporter) throw new Error(`Missing demo reporter ${item.reporterEmail}`);
    const eventDate = new Date(Date.now() - item.daysAgo * 24 * 60 * 60 * 1000);
    await ItemModel.findOneAndUpdate(
      { seedKey: item.seedKey },
      {
        $set: {
          title: item.title,
          description: item.description,
          searchText: buildSearchText([item.title, item.description, item.location, item.category]),
          type: item.type,
          category: item.category,
          location: item.location,
          eventDate,
          identifyingDetails: item.identifyingDetails ?? "",
          contactPreference: "in_app",
          notes: "Fictional campus sample. Not a real lost-property record.",
          reporter: reporter._id,
          status: item.status,
          isDemo: true,
          seedKey: item.seedKey,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  const earbuds = await ItemModel.findOne({ seedKey: "seed-earbuds-found" });
  const idCard = await ItemModel.findOne({ seedKey: "seed-id-found" });
  const keys = await ItemModel.findOne({ seedKey: "seed-keys-found" });
  const bag = await ItemModel.findOne({ seedKey: "seed-bag-found" });
  if (!earbuds || !idCard || !keys || !bag) throw new Error("Demo items were not saved.");

  await ClaimModel.findOneAndUpdate(
    { seedKey: "seed-claim-id-pending" },
    {
      $set: {
        item: idCard._id,
        claimant: meera._id,
        explanation: "The photo and enrollment number on the card match my student record.",
        proofDescription: "I can describe the card number privately to the finder.",
        status: "pending",
        isDemo: true,
        seedKey: "seed-claim-id-pending",
      },
    },
    { upsert: true, new: true },
  );
  await ClaimModel.findOneAndUpdate(
    { seedKey: "seed-claim-keys-approved" },
    {
      $set: {
        item: keys._id,
        claimant: asha._id,
        explanation: "The ring has three keys, including a small brass hostel key.",
        proofDescription: "Brass key has a stamped letter H.",
        status: "approved",
        reviewedBy: meera._id,
        reviewedAt: new Date(),
        reviewNote: "Details matched the keys.",
        isDemo: true,
        seedKey: "seed-claim-keys-approved",
      },
    },
    { upsert: true, new: true },
  );
  await ItemModel.updateOne(
    { _id: keys._id },
    {
      status: "resolved",
      resolution: { resolvedBy: meera._id, resolvedAt: new Date(), claim: undefined },
    },
  );
  const approvedClaim = await ClaimModel.findOne({ seedKey: "seed-claim-keys-approved" });
  if (approvedClaim) {
    await ItemModel.updateOne(
      { _id: keys._id },
      { "resolution.claim": approvedClaim._id, "resolution.resolvedBy": meera._id },
    );
  }
  await ClaimModel.findOneAndUpdate(
    { seedKey: "seed-claim-bag-rejected" },
    {
      $set: {
        item: bag._id,
        claimant: rohan._id,
        explanation: "I thought this was my navy bag from the auditorium.",
        proofDescription: "My bag has a red zipper pull, which this one does not.",
        status: "rejected",
        reviewedBy: asha._id,
        reviewedAt: new Date(),
        reviewNote: "The zipper description did not match.",
        isDemo: true,
        seedKey: "seed-claim-bag-rejected",
      },
    },
    { upsert: true, new: true },
  );
  await ClaimModel.findOneAndUpdate(
    { seedKey: "seed-claim-earbuds-cancelled" },
    {
      $set: {
        item: earbuds._id,
        claimant: asha._id,
        explanation: "These look like the earbuds I lost at the library entrance.",
        proofDescription: "",
        status: "cancelled",
        isDemo: true,
        seedKey: "seed-claim-earbuds-cancelled",
      },
    },
    { upsert: true, new: true },
  );

  await ActivityModel.deleteMany({ isDemo: true, action: { $in: ["seed.loaded"] } });
  await ActivityModel.create({
    actor: asha._id,
    action: "seed.loaded",
    resourceType: "user",
    resourceId: asha._id,
    metadata: { note: "Fictional demo data" },
    isDemo: true,
  });
}

async function main() {
  getEnv();
  await connectDatabase(process.env.MONGODB_URI!);
  if (clearOnly) {
    await clearDemoData();
  } else {
    await ensureAdmin();
    const password = process.env.DEMO_STUDENT_PASSWORD?.trim() || "campus-demo-2026";
    await seedItems(password);
    console.log("Demo data is ready. Student password comes from DEMO_STUDENT_PASSWORD.");
  }
  await disconnectDatabase();
}

void main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
