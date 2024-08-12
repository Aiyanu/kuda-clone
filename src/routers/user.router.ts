import express, { Request, Response } from "express";
import UserController from "../controller/user.controller";
import { validator } from "../middleware/index.middleware";
import ValidationSchema from "../validators/user.validator.schema";
import UserService from "../services/user.service";
import UserDataSource from "../datasources/user.datasource";
import TokenService from "../services/token.services";
import TokenDataSource from "../datasources/token.datasource";

const router = express.Router();
export const userService = new UserService(new UserDataSource());
const tokenService = new TokenService(new TokenDataSource());
const userController = new UserController(userService, tokenService);
const createUserRoute = () => {
  router.post(
    "/register",
    validator(ValidationSchema.registerSchema),
    (req: Request, res: Response) => {
      return userController.register(req, res);
    }
  );

  router.post(
    "/login",
    validator(ValidationSchema.loginSchema),
    (req: Request, res: Response) => {
      return userController.login(req, res);
    }
  );

  router.post(
    "/forgot-password",
    validator(ValidationSchema.forgotPasswordSchema),
    (req: Request, res: Response) => {
      return userController.forgotPassword(req, res);
    }
  );

  router.post(
    "/reset-password",
    validator(ValidationSchema.resetPasswordSchema),
    (req: Request, res: Response) => {
      return userController.resetPassword(req, res);
    }
  );

  return router;
};

export default createUserRoute();
