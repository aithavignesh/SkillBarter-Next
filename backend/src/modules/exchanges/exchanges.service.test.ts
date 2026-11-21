import mongoose from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Exchange } from "../../models/Exchange";
import { ExchangeSession } from "../../models/ExchangeSession";
import { ExchangesService } from "./exchanges.service";

describe("ExchangesService.updateSessionStatus route binding", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects a session when its exchange ID does not match the route exchange ID", async () => {
    const routeExchangeId = new mongoose.Types.ObjectId().toString();
    const sessionExchangeId = new mongoose.Types.ObjectId().toString();
    const sessionId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();

    vi.spyOn(ExchangeSession, "findById").mockImplementation(
      (() => Promise.resolve({
        exchangeId: new mongoose.Types.ObjectId(sessionExchangeId),
      })) as unknown as typeof ExchangeSession.findById
    );
    const exchangeLookup = vi.spyOn(Exchange, "findById");

    const service = new ExchangesService();

    await expect(
      service.updateSessionStatus(routeExchangeId, sessionId, userId, {
        status: "CONFIRMED",
      })
    ).rejects.toThrow("Session not found for this exchange");

    expect(exchangeLookup).not.toHaveBeenCalled();
  });
});


describe("ExchangesService two-party lifecycle integration", () => {
  const service = new ExchangesService();

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all([
      Exchange.deleteMany({}),
      ExchangeSession.deleteMany({}),
      mongoose.connection.collection("users").deleteMany({}),
      mongoose.connection.collection("skills").deleteMany({}),
      mongoose.connection.collection("userskills").deleteMany({}),
      mongoose.connection.collection("conversations").deleteMany({}),
      mongoose.connection.collection("notifications").deleteMany({}),
      mongoose.connection.collection("analyticsevents").deleteMany({}),
    ]);
  });

  it("requires recipient acceptance, opposite-party session confirmation, and both completion confirmations", async () => {
    const requester = await User.create({
      email: "requester.lifecycle@example.test",
      passwordHash: "test-password-hash",
      displayName: "Requester",
      onboardingCompleted: true,
    });
    const recipient = await User.create({
      email: "recipient.lifecycle@example.test",
      passwordHash: "test-password-hash",
      displayName: "Recipient",
      onboardingCompleted: true,
    });
    const offeredSkill = await Skill.create({
      name: "TypeScript",
      normalizedName: "typescript-lifecycle",
      category: "Technology",
    });
    const wantedSkill = await Skill.create({
      name: "UI Design",
      normalizedName: "ui-design-lifecycle",
      category: "Design",
    });

    await UserSkill.create({
      userId: requester._id,
      skillId: offeredSkill._id,
      skillName: offeredSkill.name,
      category: offeredSkill.category,
      type: "offered",
    });
    await UserSkill.create({
      userId: recipient._id,
      skillId: wantedSkill._id,
      skillName: wantedSkill.name,
      category: wantedSkill.category,
      type: "offered",
    });

    const proposal = await service.createExchange(requester.id, {
      recipientId: recipient.id,
      offeredSkillId: offeredSkill.id,
      wantedSkillId: wantedSkill.id,
      proposalDescription: "Exchange TypeScript for UI design",
    });

    expect(proposal.status).toBe("PENDING");
    expect(await Conversation.countDocuments({})).toBe(1);
    expect(await Notification.countDocuments({ recipientId: recipient._id, type: "EXCHANGE_REQUESTED" })).toBe(1);
    expect(await AnalyticsEvent.countDocuments({ eventName: "EXCHANGE_REQUESTED" })).toBe(1);

    await expect(
      service.updateExchangeStatus(proposal.id, requester.id, { status: "ACCEPTED" })
    ).rejects.toThrow("Only the recipient can accept or reject an exchange request");

    const accepted = await service.updateExchangeStatus(proposal.id, recipient.id, {
      status: "ACCEPTED",
    });
    expect(accepted.status).toBe("ACCEPTED");

    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const session = await service.createSession(requester.id, {
      exchangeId: proposal.id,
      title: "First learning session",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes: "Bring practice exercises",
    });
    expect(session.status).toBe("PROPOSED");

    await expect(
      service.updateSessionStatus(proposal.id, session.id, requester.id, { status: "CONFIRMED" })
    ).rejects.toThrow("The participant who proposed a session cannot confirm it");

    const confirmedSession = await service.updateSessionStatus(
      proposal.id,
      session.id,
      recipient.id,
      { status: "CONFIRMED" }
    );
    expect(confirmedSession.status).toBe("CONFIRMED");
    expect((await Exchange.findById(proposal.id))?.status).toBe("SCHEDULED");

    const firstConfirmation = await service.confirmCompletion(proposal.id, requester.id);
    expect(firstConfirmation.status).toBe("SCHEDULED");
    expect(firstConfirmation.completionStatus).toEqual({
      requesterConfirmed: true,
      recipientConfirmed: false,
    });
    expect(await User.findById(requester.id).then((user) => user?.completedExchangesCount)).toBe(0);
    expect(await User.findById(recipient.id).then((user) => user?.completedExchangesCount)).toBe(0);

    const completed = await service.confirmCompletion(proposal.id, recipient.id);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.completionStatus).toEqual({
      requesterConfirmed: true,
      recipientConfirmed: true,
    });

    await service.confirmCompletion(proposal.id, requester.id);
    expect(await User.findById(requester.id).then((user) => user?.completedExchangesCount)).toBe(1);
    expect(await User.findById(recipient.id).then((user) => user?.completedExchangesCount)).toBe(1);
    expect(await AnalyticsEvent.countDocuments({ eventName: "EXCHANGE_COMPLETED" })).toBe(1);
  });
});
