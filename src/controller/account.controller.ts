import { ResponseCode } from "../interfaces/enum/code.enum";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import JWT from "jsonwebtoken";
import AccountService from "../services/account.service";
import { IAccountCreationBody } from "../interfaces/account.interface";
import Utility from "../utils/index.utils";
import { autoInjectable } from "tsyringe";
import PayeeService from "../services/payee.service";
import Permissions from "../permissions";

@autoInjectable()
class AccountController {
  private accountService: AccountService;
  private payeeService: PayeeService;

  constructor(_accountService: AccountService, _payeeService: PayeeService) {
    this.accountService = _accountService;
    this.payeeService = _payeeService;
  }

  async createAccount(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      const newAccount = {
        userId: params.user.id,
        type: params.type,
      };

      let account = await this.accountService.createAccount(newAccount);
      return Utility.handleSuccess(
        res,
        "Account Created Successfully",
        {
          account,
        },
        ResponseCode.SUCCESS
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR
      );
    }
  }
  async getAllUserAccount(req: Request, res: Response) {
    try {
      const params = { ...req.body };

      let account = await this.accountService.getAccountByUserId(
        params.user.id
      );
      return Utility.handleSuccess(
        res,
        "Account Fetched Successfully",
        {
          account,
        },
        ResponseCode.SUCCESS
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR
      );
    }
  }
  async getUserAccount(req: Request, res: Response) {
    try {
      const params = { ...req.params };

      let account = await this.accountService.getAccountByField({
        id: Utility.escapeHtml(params.id),
      });
      if (!account) {
        return Utility.handleError(
          res,
          "Account does not exist",
          ResponseCode.NOT_FOUND
        );
      }
      return Utility.handleSuccess(
        res,
        "Account Fetched Successfully",
        {
          account,
        },
        ResponseCode.SUCCESS
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR
      );
    }
  }
  async getAllAccountsByAdmin(req: Request, res: Response) {
    try {
      const admin = { ...req.body.user };
      const permission = Permissions.can(admin.role).readAny("accounts");
      if (!permission.granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.NOT_FOUND
        );
      }

      let accounts = await this.accountService.getAccounts();

      return Utility.handleSuccess(
        res,
        "Accounts Fetched successfully",
        { accounts },
        ResponseCode.SUCCESS
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR
      );
    }
  }
  async getSingleAccountId(req: Request, res: Response) {
    try {
      const params = { ...req.params };
      const admin = { ...req.body.user };

      const permission = Permissions.can(admin.role).readAny("accounts");
      if (!permission.granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.NOT_FOUND
        );
      }

      let account = await this.accountService.getAccountByField({
        id: Utility.escapeHtml(params.id),
      });

      if (!account) {
        return Utility.handleError(
          res,
          "Account does not exist",
          ResponseCode.NOT_FOUND
        );
      }
      return Utility.handleSuccess(
        res,
        "Account Fetched successfully",
        { account },
        ResponseCode.SUCCESS
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR
      );
    }
  }
  async getAllUserPayee(req: Request, res: Response) {
    try {
      const params = { ...req.body };

      let payee = await this.payeeService.getPayeesByUserId(params.user.id);
      return Utility.handleSuccess(
        res,
        "Payee Fetched Successfully",
        {
          payee,
        },
        ResponseCode.SUCCESS
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR
      );
    }
  }
  async getUserPayee(req: Request, res: Response) {
    try {
      const params = { ...req.params };

      let payee = await this.payeeService.getPayeeByField({
        id: Utility.escapeHtml(params.id),
      });
      if (!payee) {
        return Utility.handleError(
          res,
          "Payee does not exist",
          ResponseCode.NOT_FOUND
        );
      }
      return Utility.handleSuccess(
        res,
        "Payee Fetched Successfully",
        {
          payee,
        },
        ResponseCode.SUCCESS
      );
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR
      );
    }
  }
}

export default AccountController;
