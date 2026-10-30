import { Router } from "express";
import { usersController } from "./users.controller";
import { authenticate, optionalAuth } from "../../middleware/auth";

export const usersRouter = Router();

usersRouter.post("/onboarding", authenticate, (req, res, next) => usersController.completeOnboarding(req, res, next));
usersRouter.get("/:id", optionalAuth, (req, res, next) => usersController.getProfile(req, res, next));
usersRouter.patch("/profile", authenticate, (req, res, next) => usersController.updateProfile(req, res, next));
