import express, { Request, Response } from "express";
import AccountController from "../controller/account.controller";
import { Auth, validator } from "../middleware/index.middleware";
import AccountService from "../services/account.service";
import AccountDataSource from "../datasources/account.datasource";
import TokenService from "../services/token.services";
import TokenDataSource from "../datasources/token.datasource";
import ValidationSchema from "../validators/account.validator.schema";

const router = express.Router();
const accountService = new AccountService(new AccountDataSource());
const accountController = new AccountController(accountService);
const createAccountRoute = () => {
  /**
   * @swagger
   * /api/account/create-account:
   *   post:
   *     summary: Create a new account
   *     tags: [Account]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateAccount'
   *     responses:
   *       201:
   *         description: Account created successfully
   */
  router.post(
    "/create-account",
    validator(ValidationSchema.createAccountSchema),
    Auth(),
    (req: Request, res: Response) => {
      return accountController.createAccount(req, res);
    }
  );

  /**
   * @swagger
   * /api/account/account-list:
   *   get:
   *     summary: Get all user accounts
   *     tags: [Account]
   *     responses:
   *       200:
   *         description: List of user accounts
   */
  router.get("/account-list", Auth(), (req: Request, res: Response) => {
    return accountController.getAllUserAccount(req, res);
  });

  /**
   * @swagger
   * /api/account/{id}:
   *   get:
   *     summary: Get a user account by ID
   *     tags: [Account]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Account ID
   *     responses:
   *       200:
   *         description: User account details
   */
  router.get("/:id", Auth(), (req: Request, res: Response) => {
    return accountController.getUserAccount(req, res);
  });
  return router;
};

export default createAccountRoute();
