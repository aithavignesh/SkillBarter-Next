import { z } from "zod";

export const connectionStatusEnum = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);
export type ConnectionStatus = z.infer<typeof connectionStatusEnum>;

export const createPostSchema = z.object({
  title: z.string().min(3).max(150).trim(),
  content: z.string().min(10).max(5000).trim(),
  tags: z.array(z.string().min(1).max(30).trim()).max(5).default([]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export interface ConnectionDto {
  id: string;
  requesterId: string;
  recipientId: string;
  status: ConnectionStatus;
  otherUser?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    reputationScore: number;
  };
  createdAt: string;
}

export interface CommunityPostDto {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  title: string;
  content: string;
  tags: string[];
  likesCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}
