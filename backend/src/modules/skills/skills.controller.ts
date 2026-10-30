import { Request, Response, NextFunction } from "express";
import { skillsService } from "./skills.service";
import {
  skillCreateSchema,
  userSkillCreateSchema,
  userSkillUpdateSchema,
} from "@skillbarter/shared";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../middleware/errorHandler";

export class SkillsController {
  async listSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await skillsService.listSkills({ category, search, page, limit });
      sendSuccess(res, result.skills, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async createSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = skillCreateSchema.parse(req.body);
      const skill = await skillsService.createSkill(input, req.user?._id.toString());
      sendSuccess(res, { skill }, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async getMySkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const skills = await skillsService.getUserSkills(req.user._id.toString());
      sendSuccess(res, { skills });
    } catch (error) {
      next(error);
    }
  }

  async addUserSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = userSkillCreateSchema.parse(req.body);
      const userSkill = await skillsService.addUserSkill(req.user._id.toString(), input);
      sendSuccess(res, { userSkill }, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateUserSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = userSkillUpdateSchema.parse(req.body);
      const userSkill = await skillsService.updateUserSkill(
        req.user._id.toString(),
        req.params.id as string,
        input
      );
      sendSuccess(res, { userSkill });
    } catch (error) {
      next(error);
    }
  }

  async removeUserSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      await skillsService.removeUserSkill(req.user._id.toString(), req.params.id as string);
      sendSuccess(res, { message: "Skill association removed" });
    } catch (error) {
      next(error);
    }
  }
}

export const skillsController = new SkillsController();
