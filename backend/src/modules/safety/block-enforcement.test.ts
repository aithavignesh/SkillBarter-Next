import { describe, expect, it } from "vitest";
import { User } from "../../models/User";
import { Block } from "../../models/Block";
import { Connection } from "../../models/Connection";
import { Conversation } from "../../models/Conversation";
import { messagesService } from "../messages/messages.service";
import { communityService } from "../community/community.service";

describe("Block enforcement across social entry points", () => {
  it("prevents new conversations and connection requests in either direction", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const userA = await User.create({
      email: `block-enforcement-a-${suffix}@example.com`,
      passwordHash: "test-hash",
      displayName: "Block Test A",
    });
    const userB = await User.create({
      email: `block-enforcement-b-${suffix}@example.com`,
      passwordHash: "test-hash",
      displayName: "Block Test B",
    });

    try {
      await Block.create({ blockerId: userA._id, blockedUserId: userB._id, reason: "test" });

      await expect(
        messagesService.getOrCreateConversation(userB._id.toString(), userA._id.toString()),
      ).rejects.toMatchObject({ statusCode: 403, code: "BLOCKED" });

      await expect(
        communityService.requestConnection(userB._id.toString(), userA._id.toString()),
      ).rejects.toMatchObject({ statusCode: 403, code: "BLOCKED" });

      expect(await Conversation.countDocuments({ participants: { $all: [userA._id, userB._id] } })).toBe(0);
      expect(await Connection.countDocuments({
        $or: [
          { requesterId: userA._id, recipientId: userB._id },
          { requesterId: userB._id, recipientId: userA._id },
        ],
      })).toBe(0);
    } finally {
      await Block.deleteMany({
        $or: [
          { blockerId: userA._id, blockedUserId: userB._id },
          { blockerId: userB._id, blockedUserId: userA._id },
        ],
      });
      await Conversation.deleteMany({ participants: { $all: [userA._id, userB._id] } });
      await Connection.deleteMany({
        $or: [
          { requesterId: userA._id, recipientId: userB._id },
          { requesterId: userB._id, recipientId: userA._id },
        ],
      });
      await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    }
  });
});
