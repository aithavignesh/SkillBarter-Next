import { Router } from "express";
import { skillsController } from "./skills.controller";
import { authenticate, optionalAuth } from "../../middleware/auth";

export const skillsRouter = Router();

skillsRouter.get("/", optionalAuth, (req, res, next) => skillsController.listSkills(req, res, next));
skillsRouter.post("/", authenticate, (req, res, next) => skillsController.createSkill(req, res, next));
skillsRouter.get("/user", authenticate, (req, res, next) => skillsController.getMySkills(req, res, next));
skillsRouter.post("/user", authenticate, (req, res, next) => skillsController.addUserSkill(req, res, next));
skillsRouter.patch("/user/:id", authenticate, (req, res, next) => skillsController.updateUserSkill(req, res, next));
skillsRouter.delete("/user/:id", authenticate, (req, res, next) => skillsController.removeUserSkill(req, res, next));
