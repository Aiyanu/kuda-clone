import express, { Request, Response } from "express";
import UserController from "../controller/user.controller";
import AccountController from "../controller/account.controller";
import { container } from "tsyringe";
import TransactionController from "../controller/transaction.controller";
import { AdminAuth, validator } from "../middleware/index.middleware";
import ValidationSchema from "../validators/user.validator.schema";
const router = express.Router();
const userController = container.resolve(UserController);
const accountController = container.resolve(AccountController);
const transactionController = container.resolve(TransactionController);

const createAdminRoute = () => {
  router.get("/users", AdminAuth(), (req: Request, res: Response) => {
    return userController.getAllUsersByAdmin(req, res);
  });
  router.get("/users/:id", AdminAuth(), (req: Request, res: Response) => {
    return userController.getSingleUserId(req, res);
  });
  router.post(
    "/users/set-user-status",
    validator(ValidationSchema.setAccountStatusSchema),
    AdminAuth(),
    (req: Request, res: Response) => {
      return userController.setAccountStatus(req, res);
    }
  );
  router.get("/accounts", AdminAuth(), (req: Request, res: Response) => {
    return accountController.getAllAccountsByAdmin(req, res);
  });
  router.get("/accounts/:id", AdminAuth(), (req: Request, res: Response) => {
    return accountController.getSingleAccountId(req, res);
  });
  router.get("/transactions", AdminAuth(), (req: Request, res: Response) => {
    return transactionController.getAllTransactionsByAdmin(req, res);
  });
  router.get(
    "/transactions/:id",
    AdminAuth(),
    (req: Request, res: Response) => {
      return transactionController.getSingleTransactionId(req, res);
    }
  );
  return router;
};
export default createAdminRoute();
