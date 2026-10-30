import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message cannot exceed 2000 characters").trim(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  readBy: string[];
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  participants: Array<{
    id: string;
    displayName: string;
    avatarUrl?: string;
  }>;
  exchangeId?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}
