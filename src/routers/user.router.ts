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
  /**
   * @swagger
   * /api/user/register:
   *   post:
   *     summary: Register a new user
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterUser'
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Bad request
   */
  router.post(
    "/register",
    validator(ValidationSchema.registerSchema),
    (req: Request, res: Response) => {
      return userController.register(req, res);
    }
  );

  /**
   * @swagger
   * /api/user/login:
   *   post:
   *     summary: Login a user
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginUser'
   *     responses:
   *       200:
   *         description: User logged in successfully
   *       401:
   *         description: Unauthorized
   */
  router.post(
    "/login",
    validator(ValidationSchema.loginSchema),
    (req: Request, res: Response) => {
      return userController.login(req, res);
    }
  );

  /**
   * @swagger
   * /api/user/forgot-password:
   *   post:
   *     summary: Request password reset
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ForgotPassword'
   *     responses:
   *       200:
   *         description: Password reset email sent
   *       400:
   *         description: Bad request
   */
  router.post(
    "/forgot-password",
    validator(ValidationSchema.forgotPasswordSchema),
    (req: Request, res: Response) => {
      return userController.forgotPassword(req, res);
    }
  );

  /**
   * @swagger
   * /api/user/reset-password:
   *   post:
   *     summary: Reset user password
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ResetPassword'
   *     responses:
   *       200:
   *         description: Password reset successfully
   *       400:
   *         description: Bad request
   */
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
