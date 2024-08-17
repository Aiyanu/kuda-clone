import express, { Request, Response } from "express";
import TransactionController from "../controller/transaction.controller";
import { Auth, validator } from "../middleware/index.middleware";
import TransactionService from "../services/transaction.service";
import TransactionDataSource from "../datasources/transaction.datasource";
import TokenService from "../services/token.services";
import TokenDataSource from "../datasources/token.datasource";
import ValidationSchema from "../validators/transaction.validator.schema";
import AccountService from "../services/account.service";
import AccountDataSource from "../datasources/account.datasource";

const router = express.Router();
const transactionService = new TransactionService(new TransactionDataSource());
const accountService = new AccountService(new AccountDataSource());
const transactionController = new TransactionController(
  transactionService,
  accountService
);
const createTransactionRoute = () => {
  router.post(
    "/initiate-paystack-deposit",
    validator(ValidationSchema.initiatePaystackDeposit),
    Auth(),
    (req: Request, res: Response) => {
      return transactionController.initiatePaystackDeposit(req, res);
    }
  );
  router.post(
    "/verify-paystack-deposit",
    validator(ValidationSchema.verifyPaystackDeposit),
    Auth(),
    (req: Request, res: Response) => {
      return transactionController.verifyPaystackDeposit(req, res);
    }
  );
  router.post(
    "/make-transfer",
    validator(ValidationSchema.makeInternalTransferSchema),
    Auth(),
    (req: Request, res: Response) => {
      return transactionController.internalTransfer(req, res);
    }
  );
  return router;
};

export default createTransactionRoute();
