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
import PayeeService from "../services/payee.service";
import PayeeDataSource from "../datasources/payee.datasource";

const router = express.Router();
const transactionService = new TransactionService(new TransactionDataSource());
const accountService = new AccountService(new AccountDataSource());
const payeeService = new PayeeService(new PayeeDataSource());
const transactionController = new TransactionController(
  transactionService,
  accountService,
  payeeService
);
const createTransactionRoute = () => {
  /**
   * @swagger
   * /api/transaction/initiate-paystack-deposit:
   *   post:
   *     summary: Initiate a Paystack deposit
   *     tags: [Transaction]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/InitiatePaystackDeposit'
   *     responses:
   *       200:
   *         description: Deposit initiated
   */
  router.post(
    "/initiate-paystack-deposit",
    validator(ValidationSchema.initiatePaystackDeposit),
    Auth(),
    (req: Request, res: Response) => {
      return transactionController.initiatePaystackDeposit(req, res);
    }
  );

  /**
   * @swagger
   * /api/transaction/verify-paystack-deposit:
   *   post:
   *     summary: Verify a Paystack deposit
   *     tags: [Transaction]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/VerifyPaystackDeposit'
   *     responses:
   *       200:
   *         description: Deposit verified
   */
  router.post(
    "/verify-paystack-deposit",
    validator(ValidationSchema.verifyPaystackDeposit),
    Auth(),
    (req: Request, res: Response) => {
      return transactionController.verifyPaystackDeposit(req, res);
    }
  );

  /**
   * @swagger
   * /api/transaction/make-transfer:
   *   post:
   *     summary: Make an internal transfer
   *     tags: [Transaction]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MakeInternalTransfer'
   *     responses:
   *       200:
   *         description: Transfer successful
   */
  router.post(
    "/make-transfer",
    validator(ValidationSchema.makeInternalTransferSchema),
    Auth(),
    (req: Request, res: Response) => {
      return transactionController.internalTransfer(req, res);
    }
  );

  /**
   * @swagger
   * /api/transaction/make-withdrawal-by-paystack:
   *   post:
   *     summary: Make a withdrawal by Paystack
   *     tags: [Transaction]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MakeWithdrawalByPaystack'
   *     responses:
   *       200:
   *         description: Withdrawal successful
   */
  router.post(
    "/make-withdrawal-by-paystack",
    validator(ValidationSchema.makeWithdrawalByPaystack),
    Auth(),
    (req: Request, res: Response) => {
      return transactionController.withdrawByPaystack(req, res);
    }
  );
  return router;
};

export default createTransactionRoute();
