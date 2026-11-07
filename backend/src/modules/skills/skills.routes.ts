import { Router } from "express";
import { skillsController } from "./skills.controller";
import { authenticate, optionalAuth, requireOnboardingCompleted } from "../../middleware/auth";

export const skillsRouter = Router();

skillsRouter.get("/", optionalAuth, (req, res, next) => skillsController.listSkills(req, res, next));
skillsRouter.post("/", authenticate, requireOnboardingCompleted, (req, res, next) => skillsController.createSkill(req, res, next));
skillsRouter.use("/user", authenticate, requireOnboardingCompleted);
skillsRouter.get("/user", (req, res, next) => skillsController.getMySkills(req, res, next));
skillsRouter.post("/user", (req, res, next) => skillsController.addUserSkill(req, res, next));
skillsRouter.patch("/user/:id", (req, res, next) => skillsController.updateUserSkill(req, res, next));
skillsRouter.delete("/user/:id", (req, res, next) => skillsController.removeUserSkill(req, res, next));
