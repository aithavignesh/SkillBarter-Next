import { afterAll, describe, expect, it } from "vitest";
import { User } from "../../models/User";
import { CommunityPost } from "../../models/CommunityPost";
import { Block } from "../../models/Block";
import { communityService } from "./community.service";

describe("Community post likes", () => {
  const userIds: string[] = [];
  const postIds: string[] = [];

  afterAll(async () => {
    await CommunityPost.deleteMany({ _id: { $in: postIds } });
    await Block.deleteMany({
      $or: [
        { blockerId: { $in: userIds } },
        { blockedUserId: { $in: userIds } },
      ],
    });
    await User.deleteMany({ _id: { $in: userIds } });
  });

  it("makes likes idempotent and reports the viewer's like state", async () => {
    const suffix = Date.now() + "-" + Math.random().toString(36).slice(2);
    const author = await User.create({
      email: "post-like-author-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Post Author",
      isEmailVerified: true,
    });
    const member = await User.create({
      email: "post-like-member-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Post Liker",
      isEmailVerified: true,
    });
    userIds.push(author._id.toString(), member._id.toString());

    const post = await CommunityPost.create({
      authorId: author._id,
      title: "A skill to share",
      content: "I can teach this skill to another member.",
      tags: ["offer"],
    });
    postIds.push(post._id.toString());

    const firstLike = await communityService.likePost(post._id.toString(), member._id.toString());
    expect(firstLike.likesCount).toBe(1);
    expect(firstLike.likedByMe).toBe(true);
    expect(firstLike.authorName).toBe("Post Author");

    const duplicateLike = await communityService.likePost(post._id.toString(), member._id.toString());
    expect(duplicateLike.likesCount).toBe(1);
    expect(duplicateLike.likedByMe).toBe(true);

    const listed = await communityService.listPosts(1, 20, member._id.toString());
    expect(listed.posts[0].likedByMe).toBe(true);

    const unlike = await communityService.unlikePost(post._id.toString(), member._id.toString());
    expect(unlike.likesCount).toBe(0);
    expect(unlike.likedByMe).toBe(false);

    const duplicateUnlike = await communityService.unlikePost(post._id.toString(), member._id.toString());
    expect(duplicateUnlike.likesCount).toBe(0);
    expect(duplicateUnlike.likedByMe).toBe(false);
  });

  it("prevents members from liking a post when either party has blocked the other", async () => {
    const suffix = Date.now() + "-" + Math.random().toString(36).slice(2);
    const author = await User.create({
      email: "post-block-author-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Blocking Author",
      isEmailVerified: true,
    });
    const member = await User.create({
      email: "post-block-member-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Blocked Member",
      isEmailVerified: true,
    });
    userIds.push(author._id.toString(), member._id.toString());

    const post = await CommunityPost.create({
      authorId: author._id,
      title: "Another skill to share",
      content: "This post is used to verify blocked member behavior.",
      tags: ["offer"],
    });
    postIds.push(post._id.toString());
    await Block.create({ blockerId: author._id, blockedUserId: member._id });

    await expect(
      communityService.likePost(post._id.toString(), member._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403, code: "BLOCKED" });
  });
});
