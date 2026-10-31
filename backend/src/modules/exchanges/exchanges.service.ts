import mongoose from "mongoose";
import { Exchange, IExchange } from "../../models/Exchange";
import { ExchangeSession, IExchangeSession } from "../../models/ExchangeSession";
import { Conversation } from "../../models/Conversation";
import { Notification } from "../../models/Notification";
import { User } from "../../models/User";
import { Skill } from "../../models/Skill";
import { Block } from "../../models/Block";
import { AnalyticsEvent } from "../../models/AnalyticsEvent";
import {
  CreateExchangeInput,
  UpdateExchangeStatusInput,
  CreateSessionInput,
  UpdateSessionStatusInput,
  ExchangeDto,
  ExchangeSessionDto,
} from "@skillbarter/shared";
import { AppError } from "../../middleware/errorHandler";

export class ExchangesService {
  async createExchange(requesterId: string, input: CreateExchangeInput): Promise<ExchangeDto> {
    if (requesterId === input.recipientId) {
      throw new AppError("You cannot initiate a skill exchange with yourself", 400, "INVALID_RECIPIENT");
    }

    // Check if blocked
    const isBlocked = await Block.findOne({
      $or: [
        { blockerId: requesterId, blockedUserId: input.recipientId },
        { blockerId: input.recipientId, blockedUserId: requesterId },
      ],
    });
    if (isBlocked) {
      throw new AppError("Cannot initiate exchange with this user", 403, "BLOCKED");
    }

    const [recipient, offeredSkill, wantedSkill, requester] = await Promise.all([
      User.findById(input.recipientId),
      Skill.findById(input.offeredSkillId),
      Skill.findById(input.wantedSkillId),
      User.findById(requesterId),
    ]);

    if (!recipient || recipient.isSuspended) {
      throw new AppError("Recipient account not available", 404, "RECIPIENT_NOT_FOUND");
    }
    if (!offeredSkill) {
      throw new AppError("Offered skill not found", 404, "SKILL_NOT_FOUND");
    }
    if (!wantedSkill) {
      throw new AppError("Wanted skill not found", 404, "SKILL_NOT_FOUND");
    }

    const exchange = await Exchange.create({
      requesterId: new mongoose.Types.ObjectId(requesterId),
      recipientId: new mongoose.Types.ObjectId(input.recipientId),
      offeredSkillId: offeredSkill._id,
      wantedSkillId: wantedSkill._id,
      status: "PENDING",
      proposalDescription: input.proposalDescription.trim(),
      completionStatus: {
        requesterConfirmed: false,
        recipientConfirmed: false,
      },
    });

    // Ensure conversation exists between participants
    const participants = [new mongoose.Types.ObjectId(requesterId), new mongoose.Types.ObjectId(input.recipientId)];
    let conversation = await Conversation.findOne({
      participants: { $all: participants },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        exchangeId: exchange._id,
        lastMessageAt: new Date(),
        lastMessageText: "Exchange proposal created",
      });
    }

    // Create persistent notification for recipient
    await Notification.create({
      recipientId: recipient._id,
      senderId: requester?._id,
      type: "EXCHANGE_REQUESTED",
      title: "New Skill Exchange Request",
      message: `${requester?.displayName || "A user"} offered to teach ${offeredSkill.name} for ${wantedSkill.name}`,
      link: `/exchanges/${exchange._id.toString()}`,
    });

    await AnalyticsEvent.create({
      eventName: "EXCHANGE_REQUESTED",
      userId: new mongoose.Types.ObjectId(requesterId),
      metadata: {
        exchangeId: exchange._id.toString(),
        offered: offeredSkill.name,
        wanted: wantedSkill.name,
      },
      timestamp: new Date(),
    });

    return this.formatExchange(exchange, requester?.displayName, recipient.displayName, offeredSkill.name, wantedSkill.name);
  }

  async listUserExchanges(userId: string, status?: string): Promise<ExchangeDto[]> {
    const filter: Record<string, unknown> = {
      $or: [{ requesterId: userId }, { recipientId: userId }],
    };
    if (status) {
      filter.status = status;
    }

    const exchanges = await Exchange.find(filter)
      .populate("requesterId", "displayName")
      .populate("recipientId", "displayName")
      .populate("offeredSkillId", "name")
      .populate("wantedSkillId", "name")
      .sort({ updatedAt: -1 });

    return exchanges.map((e) => {
      const reqUser = e.requesterId as unknown as { displayName?: string };
      const recUser = e.recipientId as unknown as { displayName?: string };
      const offSkill = e.offeredSkillId as unknown as { name?: string };
      const wantSkill = e.wantedSkillId as unknown as { name?: string };
      return this.formatExchange(
        e,
        reqUser?.displayName,
        recUser?.displayName,
        offSkill?.name,
        wantSkill?.name
      );
    });
  }

  async getExchangeById(exchangeId: string, userId: string): Promise<ExchangeDto> {
    if (!mongoose.Types.ObjectId.isValid(exchangeId)) {
      throw new AppError("Invalid exchange ID", 400, "INVALID_ID");
    }

    const exchange = await Exchange.findById(exchangeId)
      .populate("requesterId", "displayName")
      .populate("recipientId", "displayName")
      .populate("offeredSkillId", "name")
      .populate("wantedSkillId", "name");

    if (!exchange) {
      throw new AppError("Exchange not found", 404, "NOT_FOUND");
    }

    const isParticipant =
      exchange.requesterId._id.toString() === userId ||
      exchange.recipientId._id.toString() === userId;

    if (!isParticipant) {
      throw new AppError("You do not have permission to view this exchange", 403, "FORBIDDEN");
    }

    const reqUser = exchange.requesterId as unknown as { displayName?: string };
    const recUser = exchange.recipientId as unknown as { displayName?: string };
    const offSkill = exchange.offeredSkillId as unknown as { name?: string };
    const wantSkill = exchange.wantedSkillId as unknown as { name?: string };

    return this.formatExchange(
      exchange,
      reqUser?.displayName,
      recUser?.displayName,
      offSkill?.name,
      wantSkill?.name
    );
  }

  async updateExchangeStatus(
    exchangeId: string,
    userId: string,
    input: UpdateExchangeStatusInput
  ): Promise<ExchangeDto> {
    const exchange = await Exchange.findById(exchangeId);
    if (!exchange) {
      throw new AppError("Exchange not found", 404, "NOT_FOUND");
    }

    const isRequester = exchange.requesterId.toString() === userId;
    const isRecipient = exchange.recipientId.toString() === userId;

    if (!isRequester && !isRecipient) {
      throw new AppError("Unauthorized to update this exchange", 403, "FORBIDDEN");
    }

    // State transition validation
    if (input.status === "ACCEPTED" || input.status === "REJECTED") {
      if (!isRecipient) {
        throw new AppError("Only the recipient can accept or reject an exchange request", 403, "FORBIDDEN");
      }
      if (exchange.status !== "PENDING") {
        throw new AppError(`Cannot change status from ${exchange.status} to ${input.status}`, 400, "INVALID_STATE");
      }
    }

    if (input.status === "IN_PROGRESS" && exchange.status !== "SCHEDULED") {
      throw new AppError(
        `Cannot start an exchange while its status is ${exchange.status}; a scheduled exchange is required`,
        400,
        "INVALID_STATE"
      );
    }

    if (input.status === "CANCELLED") {
      if (["COMPLETED", "REJECTED", "CANCELLED", "DISPUTED"].includes(exchange.status)) {
        throw new AppError(`Cannot cancel an exchange that is already ${exchange.status}`, 400, "INVALID_STATE");
      }
      exchange.cancellationReason = input.reason || "Cancelled by participant";
    }

    exchange.status = input.status;
    await exchange.save();

    // Notify other participant
    const otherUserId = isRequester ? exchange.recipientId : exchange.requesterId;
    const actorUser = await User.findById(userId);

    const notificationTypeByStatus: Record<UpdateExchangeStatusInput["status"], string> = {
      ACCEPTED: "EXCHANGE_ACCEPTED",
      REJECTED: "EXCHANGE_REJECTED",
      CANCELLED: "EXCHANGE_CANCELLED",
      IN_PROGRESS: "EXCHANGE_STARTED",
    };
    const notificationVerbByStatus: Record<UpdateExchangeStatusInput["status"], string> = {
      ACCEPTED: "accepted",
      REJECTED: "rejected",
      CANCELLED: "cancelled",
      IN_PROGRESS: "started",
    };

    await Notification.create({
      recipientId: otherUserId,
      senderId: new mongoose.Types.ObjectId(userId),
      type: notificationTypeByStatus[input.status],
      title: `Exchange ${notificationVerbByStatus[input.status]}`,
      message: `${actorUser?.displayName || "Participant"} has ${notificationVerbByStatus[input.status]} the exchange.`,
      link: `/exchanges/${exchange._id.toString()}`,
    });

    if (input.status === "ACCEPTED") {
      await AnalyticsEvent.create({
        eventName: "EXCHANGE_ACCEPTED",
        userId: new mongoose.Types.ObjectId(userId),
        metadata: { exchangeId: exchange._id.toString() },
        timestamp: new Date(),
      });
    }

    return this.getExchangeById(exchangeId, userId);
  }

  async confirmCompletion(exchangeId: string, userId: string): Promise<ExchangeDto> {
    let exchange = await Exchange.findById(exchangeId);
    if (!exchange) {
      throw new AppError("Exchange not found", 404, "NOT_FOUND");
    }

    const isRequester = exchange.requesterId.toString() === userId;
    const isRecipient = exchange.recipientId.toString() === userId;

    if (!isRequester && !isRecipient) {
      throw new AppError("Unauthorized", 403, "FORBIDDEN");
    }

    if (!["ACCEPTED", "SCHEDULED", "IN_PROGRESS"].includes(exchange.status)) {
      throw new AppError(`Cannot complete an exchange with status ${exchange.status}`, 400, "INVALID_STATE");
    }

    // Atomically persist only this participant's first confirmation so
    // concurrent requests cannot overwrite the other participant's confirmation
    // or generate duplicate "waiting for the other participant" notifications.
    const confirmationField = isRequester
      ? "completionStatus.requesterConfirmed"
      : "completionStatus.recipientConfirmed";
    const updatedExchange = await Exchange.findOneAndUpdate(
      {
        _id: exchange._id,
        status: { $in: ["ACCEPTED", "SCHEDULED", "IN_PROGRESS"] },
        [confirmationField]: { $ne: true },
      },
      { $set: { [confirmationField]: true } },
      { new: true }
    );

    let firstConfirmation = Boolean(updatedExchange);
    if (updatedExchange) {
      exchange = updatedExchange;
    } else {
      // A null result can mean this participant already confirmed, or that the
      // exchange became terminal. Read the current state to distinguish them.
      const currentExchange = await Exchange.findById(exchange._id);
      const stillActive = currentExchange &&
        ["ACCEPTED", "SCHEDULED", "IN_PROGRESS"].includes(currentExchange.status);
      const alreadyConfirmed = currentExchange &&
        (isRequester
          ? currentExchange.completionStatus.requesterConfirmed
          : currentExchange.completionStatus.recipientConfirmed);

      if (!stillActive || !alreadyConfirmed) {
        throw new AppError(
          "The exchange can no longer be confirmed as completed",
          400,
          "INVALID_STATE"
        );
      }

      exchange = currentExchange;
      firstConfirmation = false;
    }

    const bothConfirmed =
      exchange.completionStatus.requesterConfirmed &&
      exchange.completionStatus.recipientConfirmed;

    let finalizedNow = false;
    if (bothConfirmed) {
      // Atomically claim the one-time COMPLETED transition so concurrent confirmations
      // cannot increment the participants' completion counters more than once.
      const finalizedExchange = await Exchange.findOneAndUpdate(
        {
          _id: exchange._id,
          status: { $nin: ["COMPLETED", "REJECTED", "CANCELLED", "DISPUTED"] },
          "completionStatus.requesterConfirmed": true,
          "completionStatus.recipientConfirmed": true,
        },
        { $set: { status: "COMPLETED" } },
        { new: true }
      );

      if (finalizedExchange) {
        finalizedNow = true;
        exchange.status = "COMPLETED";

        await Promise.all([
          User.findByIdAndUpdate(exchange.requesterId, { $inc: { completedExchangesCount: 1 } }),
          User.findByIdAndUpdate(exchange.recipientId, { $inc: { completedExchangesCount: 1 } }),
        ]);

        await AnalyticsEvent.create({
          eventName: "EXCHANGE_COMPLETED",
          userId: new mongoose.Types.ObjectId(userId),
          metadata: { exchangeId: exchange._id.toString() },
          timestamp: new Date(),
        });
      } else {
        const currentExchange = await Exchange.findById(exchange._id);
        if (currentExchange) exchange.status = currentExchange.status;
      }
    }

    const otherUserId = isRequester ? exchange.recipientId : exchange.requesterId;
    const actorUser = await User.findById(userId);

    if (firstConfirmation || finalizedNow) {
      await Notification.create({
        recipientId: otherUserId,
        senderId: new mongoose.Types.ObjectId(userId),
        type: finalizedNow ? "EXCHANGE_COMPLETED" : "EXCHANGE_COMPLETION_CONFIRMED",
        title: finalizedNow ? "Exchange Completed" : "Completion Confirmation Received",
        message: finalizedNow
          ? "Both participants confirmed completion of the exchange."
          : `${actorUser?.displayName || "Participant"} confirmed completion. Waiting for the other participant.`,
        link: `/exchanges/${exchange._id.toString()}`,
      });
    }

    return this.getExchangeById(exchangeId, userId);
  }

  async disputeExchange(exchangeId: string, userId: string, reason: string): Promise<ExchangeDto> {
    const exchange = await Exchange.findById(exchangeId);
    if (!exchange) {
      throw new AppError("Exchange not found", 404, "NOT_FOUND");
    }

    const isParticipant =
      exchange.requesterId.toString() === userId ||
      exchange.recipientId.toString() === userId;

    if (!isParticipant) {
      throw new AppError("Unauthorized", 403, "FORBIDDEN");
    }

    if (["COMPLETED", "REJECTED", "CANCELLED", "DISPUTED"].includes(exchange.status)) {
      throw new AppError(
        `Cannot dispute an exchange while its status is ${exchange.status}`,
        400,
        "INVALID_STATE"
      );
    }

    // Claim the dispute transition atomically. A concurrent completion or
    // cancellation must not be overwritten by this stale document save.
    const disputedExchange = await Exchange.findOneAndUpdate(
      {
        _id: exchange._id,
        status: { $nin: ["COMPLETED", "REJECTED", "CANCELLED", "DISPUTED"] },
      },
      { $set: { status: "DISPUTED", disputeReason: reason } },
      { new: true }
    );

    if (!disputedExchange) {
      const currentExchange = await Exchange.findById(exchange._id);
      const currentStatus = currentExchange?.status || "unavailable";
      throw new AppError(
        `Cannot dispute an exchange while its status is ${currentStatus}`,
        400,
        "INVALID_STATE"
      );
    }

    return this.getExchangeById(exchangeId, userId);
  }

  // --- Session Scheduling ---
  async createSession(userId: string, input: CreateSessionInput): Promise<ExchangeSessionDto> {
    const exchange = await Exchange.findById(input.exchangeId);
    if (!exchange) {
      throw new AppError("Exchange not found", 404, "NOT_FOUND");
    }

    const isParticipant =
      exchange.requesterId.toString() === userId ||
      exchange.recipientId.toString() === userId;

    if (!isParticipant) {
      throw new AppError("Unauthorized", 403, "FORBIDDEN");
    }

    if (!["ACCEPTED", "SCHEDULED", "IN_PROGRESS"].includes(exchange.status)) {
      throw new AppError(
        `Cannot schedule a session while the exchange status is ${exchange.status}`,
        400,
        "INVALID_STATE"
      );
    }

    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    // Prevent double-booking either participant across all of their exchanges.
    const participantIds = [exchange.requesterId, exchange.recipientId];
    const participantExchanges = await Exchange.find({
      $or: [
        { requesterId: { $in: participantIds } },
        { recipientId: { $in: participantIds } },
      ],
      status: { $nin: ["COMPLETED", "REJECTED", "CANCELLED", "DISPUTED"] },
    }).select("_id");
    const participantExchangeIds = participantExchanges.map((item) => item._id);

    const conflict = await ExchangeSession.findOne({
      exchangeId: { $in: participantExchangeIds },
      status: "CONFIRMED",
      // Two intervals overlap whenever each starts before the other ends.
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      throw new AppError("A confirmed session already conflicts with this time window", 409, "SESSION_CONFLICT");
    }

    const session = await ExchangeSession.create({
      exchangeId: exchange._id,
      proposedById: new mongoose.Types.ObjectId(userId),
      title: input.title.trim(),
      startTime,
      endTime,
      status: "PROPOSED",
      notes: input.notes || "",
      meetingLink: input.meetingLink || "",
    });

    const otherUserId = exchange.requesterId.toString() === userId ? exchange.recipientId : exchange.requesterId;
    const actorUser = await User.findById(userId);

    await Notification.create({
      recipientId: otherUserId,
      senderId: new mongoose.Types.ObjectId(userId),
      type: "SESSION_PROPOSED",
      title: "New Session Proposed",
      message: `${actorUser?.displayName || "Participant"} proposed a session: ${session.title}`,
      link: `/exchanges/${exchange._id.toString()}`,
    });

    return this.formatSession(session);
  }

  async listSessions(exchangeId: string, userId: string): Promise<ExchangeSessionDto[]> {
    const exchange = await Exchange.findById(exchangeId);
    if (!exchange) {
      throw new AppError("Exchange not found", 404, "NOT_FOUND");
    }

    const isParticipant =
      exchange.requesterId.toString() === userId ||
      exchange.recipientId.toString() === userId;

    if (!isParticipant) {
      throw new AppError("Unauthorized", 403, "FORBIDDEN");
    }

    const sessions = await ExchangeSession.find({ exchangeId }).sort({ startTime: 1 });
    return sessions.map((s) => this.formatSession(s));
  }

  async updateSessionStatus(
    sessionId: string,
    userId: string,
    input: UpdateSessionStatusInput
  ): Promise<ExchangeSessionDto> {
    const session = await ExchangeSession.findById(sessionId);
    if (!session) {
      throw new AppError("Session not found", 404, "NOT_FOUND");
    }

    const exchange = await Exchange.findById(session.exchangeId);
    if (!exchange) {
      throw new AppError("Exchange not found", 404, "NOT_FOUND");
    }

    const isParticipant =
      exchange.requesterId.toString() === userId ||
      exchange.recipientId.toString() === userId;

    if (!isParticipant) {
      throw new AppError("Unauthorized", 403, "FORBIDDEN");
    }

    if (["COMPLETED", "REJECTED", "CANCELLED", "DISPUTED"].includes(exchange.status)) {
      throw new AppError(
        `Cannot update a session while the exchange status is ${exchange.status}`,
        400,
        "INVALID_STATE"
      );
    }

    const allowedSessionTransitions: Record<string, string[]> = {
      PROPOSED: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["COMPLETED", "CANCELLED"],
      CANCELLED: [],
      COMPLETED: [],
    };
    if (!allowedSessionTransitions[session.status]?.includes(input.status)) {
      throw new AppError(
        `Cannot change session status from ${session.status} to ${input.status}`,
        400,
        "INVALID_STATE"
      );
    }

    if (input.status === "CONFIRMED" && !["ACCEPTED", "SCHEDULED"].includes(exchange.status)) {
      throw new AppError(
        `Cannot confirm a session while the exchange status is ${exchange.status}`,
        400,
        "INVALID_STATE"
      );
    }

    if (
      input.status === "CONFIRMED" &&
      session.proposedById.toString() === userId
    ) {
      throw new AppError(
        "The participant who proposed a session cannot confirm it",
        403,
        "FORBIDDEN"
      );
    }

    if (input.status === "CONFIRMED") {
      // Re-check at confirmation time: another proposed session may have been
      // confirmed after this session was originally created.
      const participantIds = [exchange.requesterId, exchange.recipientId];
      const participantExchanges = await Exchange.find({
        $or: [
          { requesterId: { $in: participantIds } },
          { recipientId: { $in: participantIds } },
        ],
        status: { $nin: ["COMPLETED", "REJECTED", "CANCELLED", "DISPUTED"] },
      }).select("_id");

      const conflictingConfirmedSession = await ExchangeSession.findOne({
        _id: { $ne: session._id },
        exchangeId: { $in: participantExchanges.map((item) => item._id) },
        status: "CONFIRMED",
        startTime: { $lt: session.endTime },
        endTime: { $gt: session.startTime },
      });

      if (conflictingConfirmedSession) {
        throw new AppError(
          "A confirmed session already conflicts with this time window",
          409,
          "SESSION_CONFLICT"
        );
      }
    }

    session.status = input.status;
    if (input.notes !== undefined) session.notes = input.notes;
    await session.save();

    const otherUserId =
      exchange.requesterId.toString() === userId
        ? exchange.recipientId
        : exchange.requesterId;
    const actorUser = await User.findById(userId);

    if (input.status === "CONFIRMED" || input.status === "CANCELLED") {
      const isConfirmed = input.status === "CONFIRMED";
      await Notification.create({
        recipientId: otherUserId,
        senderId: new mongoose.Types.ObjectId(userId),
        type: isConfirmed ? "SESSION_CONFIRMED" : "SESSION_CANCELLED",
        title: isConfirmed ? "Session Confirmed" : "Session Cancelled",
        message: `${actorUser?.displayName || "Participant"} ${isConfirmed ? "confirmed" : "cancelled"} the session: ${session.title}`,
        link: `/exchanges/${exchange._id.toString()}`,
      });
    }

    if (input.status === "CONFIRMED") {
      // If exchange was in ACCEPTED, advance to SCHEDULED
      if (exchange.status === "ACCEPTED") {
        exchange.status = "SCHEDULED";
        await exchange.save();
      }

      await AnalyticsEvent.create({
        eventName: "SESSION_SCHEDULED",
        userId: new mongoose.Types.ObjectId(userId),
        metadata: { sessionId: session._id.toString() },
        timestamp: new Date(),
      });
    }

    return this.formatSession(session);
  }

  private formatExchange(
    e: IExchange,
    requesterName?: string,
    recipientName?: string,
    offeredSkillName?: string,
    wantedSkillName?: string
  ): ExchangeDto {
    return {
      id: e._id.toString(),
      requesterId: e.requesterId.toString(),
      requesterName,
      recipientId: e.recipientId.toString(),
      recipientName,
      offeredSkillId: e.offeredSkillId.toString(),
      offeredSkillName,
      wantedSkillId: e.wantedSkillId.toString(),
      wantedSkillName,
      status: e.status,
      proposalDescription: e.proposalDescription,
      cancellationReason: e.cancellationReason,
      disputeReason: e.disputeReason,
      completionStatus: {
        requesterConfirmed: e.completionStatus.requesterConfirmed,
        recipientConfirmed: e.completionStatus.recipientConfirmed,
      },
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }

  private formatSession(s: IExchangeSession): ExchangeSessionDto {
    return {
      id: s._id.toString(),
      exchangeId: s.exchangeId.toString(),
      proposedById: s.proposedById.toString(),
      title: s.title,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      status: s.status,
      notes: s.notes,
      meetingLink: s.meetingLink,
      createdAt: s.createdAt.toISOString(),
    };
  }
}

export const exchangesService = new ExchangesService();
