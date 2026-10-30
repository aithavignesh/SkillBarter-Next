import { Router } from "express";
import { reviewsController } from "./reviews.controller";
import { authenticate, optionalAuth } from "../../middleware/auth";

export const reviewsRouter = Router();

reviewsRouter.post("/", authenticate, (req, res, next) => reviewsController.createReview(req, res, next));
reviewsRouter.get("/user/:userId", optionalAuth, (req, res, next) => reviewsController.getUserReviews(req, res, next));
