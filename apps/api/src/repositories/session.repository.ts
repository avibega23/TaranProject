import { SessionModel } from "../models/session.model.js";

export class SessionRepository {
  async create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await SessionModel.create({
      user: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    });
  }

  async findValidByHash(tokenHash: string): Promise<{ userId: string } | null> {
    const doc = await SessionModel.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).exec();
    if (!doc) return null;
    return { userId: doc.user.toString() };
  }

  async deleteByHash(tokenHash: string): Promise<void> {
    await SessionModel.deleteOne({ tokenHash }).exec();
  }

  async deleteForUsers(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    await SessionModel.deleteMany({ user: { $in: userIds } }).exec();
  }
}
