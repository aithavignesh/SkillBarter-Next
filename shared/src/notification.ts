export type NotificationType =
  | "EXCHANGE_REQUESTED"
  | "EXCHANGE_ACCEPTED"
  | "EXCHANGE_STARTED"
  | "EXCHANGE_REJECTED"
  | "EXCHANGE_CANCELLED"
  | "SESSION_PROPOSED"
  | "SESSION_CONFIRMED"
  | "SESSION_CANCELLED"
  | "NEW_MESSAGE"
  | "EXCHANGE_COMPLETED"
  | "REVIEW_RECEIVED"
  | "CONNECTION_REQUEST"
  | "CONNECTION_ACCEPTED"
  | "MODERATION_ALERT";

export interface NotificationDto {
  id: string;
  recipientId: string;
  senderId?: string;
  senderName?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}
