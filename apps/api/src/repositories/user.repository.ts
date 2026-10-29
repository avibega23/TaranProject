import { Types, type FilterQuery } from "mongoose";
import { UserModel } from "../models/user.model.js";
import type { AccountStatus, Role } from "../config/constants.js";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: Role;
  accountStatus: AccountStatus;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
};

type UserCreate = {
  name: string;
  email: string;
  studentId: string;
  passwordHash: string;
  role: Role;
  isDemo?: boolean;
};

function mapUser(doc: {
  _id: Types.ObjectId;
  name: string;
  email: string;
  studentId: string;
  role: Role;
  accountStatus: AccountStatus;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}): UserRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    studentId: doc.studentId,
    role: doc.role,
    accountStatus: doc.accountStatus,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class UserRepository {
  async create(input: UserCreate): Promise<UserRecord> {
    const doc = await UserModel.create(input);
    return mapUser(doc);
  }

  async findByEmail(email: string, withPassword = false): Promise<UserRecord | null> {
    const query = UserModel.findOne({ email });
    if (withPassword) query.select("+passwordHash");
    const doc = await query.exec();
    return doc ? mapUser(doc) : null;
  }

  async findByStudentId(studentId: string): Promise<UserRecord | null> {
    const doc = await UserModel.findOne({ studentId }).exec();
    return doc ? mapUser(doc) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await UserModel.findById(id).exec();
    return doc ? mapUser(doc) : null;
  }

  async updateName(id: string, name: string): Promise<UserRecord | null> {
    const doc = await UserModel.findByIdAndUpdate(id, { name }, { new: true }).exec();
    return doc ? mapUser(doc) : null;
  }

  async findMany(filter: FilterQuery<typeof UserModel>): Promise<UserRecord[]> {
    const docs = await UserModel.find(filter).exec();
    return docs.map((doc) => mapUser(doc));
  }
}
