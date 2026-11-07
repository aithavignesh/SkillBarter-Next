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
