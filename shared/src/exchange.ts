import { z } from "zod";

export const exchangeStatusEnum = z.enum([
  "DRAFT",
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
]);

export type ExchangeStatus = z.infer<typeof exchangeStatusEnum>;

export const createExchangeSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  offeredSkillId: z.string().min(1, "Skill you are offering is required"),
  wantedSkillId: z.string().min(1, "Skill you want in return is required"),
  proposalDescription: z.string().min(10, "Please explain your proposal (at least 10 characters)").max(1500),
});

export type CreateExchangeInput = z.infer<typeof createExchangeSchema>;

export const updateExchangeStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "CANCELLED", "IN_PROGRESS"]),
  reason: z.string().max(500).optional(),
});

export type UpdateExchangeStatusInput = z.infer<typeof updateExchangeStatusSchema>;

export const disputeExchangeSchema = z.object({
  reason: z.string().min(10, "Please provide a reason for the dispute (at least 10 characters)").max(1000),
});

export type DisputeExchangeInput = z.infer<typeof disputeExchangeSchema>;

export interface ExchangeDto {
  id: string;
  requesterId: string;
  requesterName?: string;
  recipientId: string;
  recipientName?: string;
  offeredSkillId: string;
  offeredSkillName?: string;
  wantedSkillId: string;
  wantedSkillName?: string;
  status: ExchangeStatus;
  proposalDescription: string;
  cancellationReason?: string;
  disputeReason?: string;
  completionStatus: {
    requesterConfirmed: boolean;
    recipientConfirmed: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
