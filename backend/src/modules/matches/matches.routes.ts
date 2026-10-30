import { Router } from "express";
import { matchesController } from "./matches.controller";
import { optionalAuth } from "../../middleware/auth";

export const matchesRouter = Router();

matchesRouter.get("/discover", optionalAuth, (req, res, next) => matchesController.discover(req, res, next));
