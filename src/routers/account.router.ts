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
  router.post(
    "/create",
    validator(ValidationSchema.createAccountSchema),
    Auth(),
    (req: Request, res: Response) => {
      return accountController.createAccount(req, res);
    }
  );
  return router;
};

export default createAccountRoute();
