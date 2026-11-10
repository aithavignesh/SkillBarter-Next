import mongoose from "mongoose";
import { Connection } from "../../models/Connection";
import { CommunityPost, ICommunityPost } from "../../models/CommunityPost";
import { User } from "../../models/User";
import { Block } from "../../models/Block";
import { Notification } from "../../models/Notification";
import { CreatePostInput, ConnectionDto, CommunityPostDto } from "@skillbarter/shared";
import { AppError } from "../../middleware/errorHandler";

export class CommunityService {
  // --- Connections ---
  async requestConnection(requesterId: string, recipientId: string): Promise<ConnectionDto> {
    if (requesterId === recipientId) {
      throw new AppError("Cannot connect with yourself", 400, "INVALID_TARGET");
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new AppError("Invalid recipient ID", 400, "INVALID_ID");
    }

    const isBlocked = await Block.findOne({
      $or: [
        { blockerId: requesterId, blockedUserId: recipientId },
        { blockerId: recipientId, blockedUserId: requesterId },
      ],
    });
    if (isBlocked) {
      throw new AppError("Cannot connect with this user", 403, "BLOCKED");
    }

    const recipient = await User.findById(recipientId);
    if (!recipient || recipient.isSuspended) {
      throw new AppError("Recipient user not found", 404, "NOT_FOUND");
    }

    const existing = await Connection.findOne({
      $or: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        throw new AppError("You are already connected with this user", 409, "ALREADY_CONNECTED");
      }
      throw new AppError("A connection request already exists between you", 409, "REQUEST_EXISTS");
    }

    const connection = await Connection.create({
      requesterId: new mongoose.Types.ObjectId(requesterId),
      recipientId: new mongoose.Types.ObjectId(recipientId),
      status: "PENDING",
    });

    const requester = await User.findById(requesterId);
    await Notification.create({
      recipientId: new mongoose.Types.ObjectId(recipientId),
      senderId: new mongoose.Types.ObjectId(requesterId),
      type: "CONNECTION_REQUEST",
      title: "New Connection Request",
      message: `${requester?.displayName || "A user"} wants to connect with you.`,
      link: "/connections",
    });

    return {
      id: connection._id.toString(),
      requesterId,
      recipientId,
      status: connection.status,
      createdAt: connection.createdAt.toISOString(),
    };
  }

  async acceptConnection(connectionId: string, userId: string): Promise<ConnectionDto> {
    const conn = await Connection.findById(connectionId);
    if (!conn) {
      throw new AppError("Connection not found", 404, "NOT_FOUND");
    }

    if (conn.recipientId.toString() !== userId) {
      throw new AppError("Only the recipient can accept a connection request", 403, "FORBIDDEN");
    }

    conn.status = "ACCEPTED";
    await conn.save();

    const recipient = await User.findById(userId);
    await Notification.create({
      recipientId: conn.requesterId,
      senderId: new mongoose.Types.ObjectId(userId),
      type: "CONNECTION_ACCEPTED",
      title: "Connection Accepted",
      message: `${recipient?.displayName || "A user"} accepted your connection request!`,
      link: `/profile/${userId}`,
    });

    return {
      id: conn._id.toString(),
      requesterId: conn.requesterId.toString(),
      recipientId: conn.recipientId.toString(),
      status: conn.status,
      createdAt: conn.createdAt.toISOString(),
    };
  }

  async removeConnection(connectionId: string, userId: string): Promise<void> {
    const conn = await Connection.findById(connectionId);
    if (!conn) {
      throw new AppError("Connection not found", 404, "NOT_FOUND");
    }

    const isMember =
      conn.requesterId.toString() === userId || conn.recipientId.toString() === userId;
    if (!isMember) {
      throw new AppError("Unauthorized", 403, "FORBIDDEN");
    }

    await conn.deleteOne();
  }

  async listConnections(userId: string, status?: string): Promise<ConnectionDto[]> {
    const filter: Record<string, unknown> = {
      $or: [{ requesterId: userId }, { recipientId: userId }],
    };
    if (status) {
      filter.status = status;
    }

    const connections = await Connection.find(filter)
      .populate("requesterId", "displayName avatarUrl bio reputationScore")
      .populate("recipientId", "displayName avatarUrl bio reputationScore")
      .sort({ updatedAt: -1 });

    return connections.map((c) => {
      const isReq = c.requesterId._id.toString() === userId;
      const otherUserDoc = isReq ? c.recipientId : c.requesterId;
      const otherUser = otherUserDoc as unknown as {
        _id: mongoose.Types.ObjectId;
        displayName: string;
        avatarUrl?: string;
        bio?: string;
        reputationScore: number;
      };

      return {
        id: c._id.toString(),
        requesterId: c.requesterId._id.toString(),
        recipientId: c.recipientId._id.toString(),
        status: c.status,
        otherUser: otherUser
          ? {
              id: otherUser._id.toString(),
              displayName: otherUser.displayName,
              avatarUrl: otherUser.avatarUrl,
              bio: otherUser.bio,
              reputationScore: otherUser.reputationScore,
            }
          : undefined,
        createdAt: c.createdAt.toISOString(),
      };
    });
  }

  // --- Community Posts ---
  async createPost(authorId: string, input: CreatePostInput): Promise<CommunityPostDto> {
    const post = await CommunityPost.create({
      authorId: new mongoose.Types.ObjectId(authorId),
      title: input.title.trim(),
      content: input.content.trim(),
      tags: input.tags || [],
    });

    const author = await User.findById(authorId);

    return {
      id: post._id.toString(),
      authorId,
      authorName: author?.displayName,
      authorAvatar: author?.avatarUrl,
      title: post.title,
      content: post.content,
      tags: post.tags,
      likesCount: post.likesCount,
      likedByMe: false,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  async listPosts(page = 1, limit = 20, viewerId?: string): Promise<{ posts: CommunityPostDto[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const normalizedPage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const normalizedLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 20;
    const skip = (normalizedPage - 1) * normalizedLimit;

    // A block is mutual for feed visibility: hide posts from members either
    // blocked by the viewer or blocking the viewer.
    const blockRelations = viewerId
      ? await Block.find({
          $or: [{ blockerId: viewerId }, { blockedUserId: viewerId }],
        }).select("blockerId blockedUserId")
      : [];
    const hiddenAuthorIds = blockRelations.map((relation) =>
      relation.blockerId.toString() === viewerId
        ? relation.blockedUserId
        : relation.blockerId,
    );
    const postFilter = hiddenAuthorIds.length
      ? { authorId: { $nin: hiddenAuthorIds } }
      : {};

    const [posts, total] = await Promise.all([
      CommunityPost.find(postFilter)
        .populate("authorId", "displayName avatarUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit),
      CommunityPost.countDocuments(postFilter),
    ]);

    const formatted: CommunityPostDto[] = posts.map((post) => this.formatPost(post, viewerId));

    return {
      posts: formatted,
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
      },
    };
  }

  async getPostById(postId: string, viewerId?: string): Promise<CommunityPostDto> {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new AppError("Invalid post ID", 400, "INVALID_ID");
    }

    const post = await CommunityPost.findById(postId).populate("authorId", "displayName avatarUrl");
    if (!post) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }

    const author = post.authorId as unknown as { _id?: mongoose.Types.ObjectId };
    const authorId = author?._id ? author._id.toString() : post.authorId.toString();

    // Match feed visibility: a block in either direction hides the post.
    if (viewerId && authorId !== viewerId) {
      const isBlocked = await Block.findOne({
        $or: [
          { blockerId: viewerId, blockedUserId: authorId },
          { blockerId: authorId, blockedUserId: viewerId },
        ],
      });
      if (isBlocked) {
        throw new AppError("Post not found", 404, "NOT_FOUND");
      }
    }

    return this.formatPost(post, viewerId);
  }

  private formatPost(post: ICommunityPost, viewerId?: string): CommunityPostDto {
    const author = post.authorId as unknown as {
      _id?: mongoose.Types.ObjectId;
      displayName?: string;
      avatarUrl?: string;
    };
    const likedBy = post.likedBy ?? [];

    return {
      id: post._id.toString(),
      authorId: author?._id ? author._id.toString() : post.authorId.toString(),
      authorName: author?.displayName,
      authorAvatar: author?.avatarUrl,
      title: post.title,
      content: post.content,
      tags: post.tags,
      likesCount: post.likesCount,
      likedByMe: viewerId ? likedBy.some((id) => id.toString() === viewerId) : false,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  private async assertPostInteractionAllowed(postId: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid post or member ID", 400, "INVALID_ID");
    }

    const post = await CommunityPost.findById(postId).select("authorId");
    if (!post) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }

    if (post.authorId.toString() === userId) return;

    const isBlocked = await Block.findOne({
      $or: [
        { blockerId: post.authorId, blockedUserId: userId },
        { blockerId: userId, blockedUserId: post.authorId },
      ],
    });
    if (isBlocked) {
      throw new AppError("Cannot interact with this member's post", 403, "BLOCKED");
    }
  }

  async likePost(postId: string, userId: string): Promise<CommunityPostDto> {
    await this.assertPostInteractionAllowed(postId, userId);
    const actorId = new mongoose.Types.ObjectId(userId);
    const updated = await CommunityPost.findOneAndUpdate(
      { _id: postId, likedBy: { $ne: actorId } },
      { $addToSet: { likedBy: actorId }, $inc: { likesCount: 1 } },
      { new: true, runValidators: true },
    ).populate("authorId", "displayName avatarUrl");

    const post = updated ?? await CommunityPost.findById(postId).populate("authorId", "displayName avatarUrl");
    if (!post) throw new AppError("Post not found", 404, "NOT_FOUND");
    return this.formatPost(post, userId);
  }

  async unlikePost(postId: string, userId: string): Promise<CommunityPostDto> {
    await this.assertPostInteractionAllowed(postId, userId);
    const actorId = new mongoose.Types.ObjectId(userId);
    const updated = await CommunityPost.findOneAndUpdate(
      { _id: postId, likedBy: actorId },
      { $pull: { likedBy: actorId }, $inc: { likesCount: -1 } },
      { new: true, runValidators: true },
    ).populate("authorId", "displayName avatarUrl");

    const post = updated ?? await CommunityPost.findById(postId).populate("authorId", "displayName avatarUrl");
    if (!post) throw new AppError("Post not found", 404, "NOT_FOUND");
    return this.formatPost(post, userId);
  }

  async deletePost(postId: string, userId: string, isAdmin = false): Promise<void> {
    const post = await CommunityPost.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }

    if (post.authorId.toString() !== userId && !isAdmin) {
      throw new AppError("Unauthorized to delete this post", 403, "FORBIDDEN");
    }

    await post.deleteOne();
  }
}

export const communityService = new CommunityService();
