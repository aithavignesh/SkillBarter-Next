import { Router } from "express";
import { usersController } from "./users.controller";
import { authenticate, authenticateForOnboarding, optionalAuth } from "../../middleware/auth";

export const usersRouter = Router();

// Completing the profile is part of account creation and must remain possible
// before email verification. Other protected user actions still require verification.
usersRouter.post("/onboarding", authenticateForOnboarding, (req, res, next) => usersController.completeOnboarding(req, res, next));
usersRouter.get("/:id", optionalAuth, (req, res, next) => usersController.getProfile(req, res, next));
usersRouter.patch("/profile", authenticate, (req, res, next) => usersController.updateProfile(req, res, next));
