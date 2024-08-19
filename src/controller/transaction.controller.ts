import { Request, response, Response } from "express";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interfaces/enum/code.enum";
import PaymentService from "../services/payment.services ";
import TransactionService from "../services/transaction.service";
import {
  TransactionGateway,
  TransactionStatus,
} from "../interfaces/enum/transaction.enum";
import sequelize from "../database";
import AccountService from "../services/account.service";
import { IAccount } from "../interfaces/account.interface";
import { ITransaction } from "../interfaces/transaction.interface";
import PayeeService from "../services/payee.service";

class TransactionController {
  private transactionService: TransactionService;
  private accountService: AccountService;
  private payeeService: PayeeService;

  constructor(
    _transactionService: TransactionService,
    _accountService: AccountService,
    _payeeService: PayeeService
  ) {
    this.transactionService = _transactionService;
    this.accountService = _accountService;
    this.payeeService = _payeeService;
  }

  private async deposit(
    accountId: string,
    transactionId: string,
    amount: number
  ): Promise<boolean> {
    const tx = await sequelize.transaction();
    try {
      await this.accountService.topUpBalance(accountId, amount, {
        transaction: tx,
      });
      await this.transactionService.setStatus(
        transactionId,
        TransactionStatus.COMPLETED,
        { transaction: tx }
      );
      await tx.commit();
      return true;
    } catch (error) {
      await tx.rollback();
      return false;
    }
  }
  private async transfer(
    senderAccount: IAccount,
    receiverAccount: IAccount,
    amount: number
  ): Promise<{ status: boolean; transaction: ITransaction | null }> {
    const tx = await sequelize.transaction();
    try {
      await this.accountService.topUpBalance(senderAccount.id, -amount, {
        transaction: tx,
      });
      await this.accountService.topUpBalance(receiverAccount.id, amount, {
        transaction: tx,
      });

      const newTransaction = {
        userId: senderAccount.userId,
        accountId: senderAccount.id,
        amount,
        detail: {
          receiverAccountNumber: receiverAccount.accountNumber,
        },
      };
      let transfer = await this.transactionService.processInternalTransfer(
        newTransaction,
        { transaction: tx }
      );

      await tx.commit();
      return { status: true, transaction: transfer };
    } catch (error) {
      await tx.rollback();
      return { status: false, transaction: null };
    }
  }
  private async transferToExternalAccount(
    senderAccount: IAccount,
    receiverAccount: IAccount,
    reference: string,
    amount: number
  ): Promise<{ status: boolean; transaction: ITransaction | null }> {
    const tx = await sequelize.transaction();
    try {
      await this.accountService.topUpBalance(senderAccount.id, -amount, {
        transaction: tx,
      });

      const newTransaction = {
        userId: senderAccount.userId,
        reference,
        accountId: senderAccount.id,
        amount,
        detail: {
          receiverAccountNumber: receiverAccount.accountNumber,
          geteway: TransactionGateway.PAYSTACK,
        },
      };

      let transfer = await this.transactionService.processExternalTransfer(
        newTransaction,
        { transaction: tx }
      );

      await tx.commit();
      return { status: true, transaction: transfer };
    } catch (error) {
      await tx.rollback();
      return { status: false, transaction: null };
    }
  }

  async initiatePaystackDeposit(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      const depositInfo = await PaymentService.generatePaystackPaymentUrl(
        params.user.email,
        params.amount
      );
      if (!depositInfo) {
        return Utility.handleError(
          res,
          "Paystack payment not available, try again in a few seconds",
          ResponseCode.NOT_FOUND
        );
      }
      const newTransaction = {
        userId: params.user.id,
        accountId: params.accountId,
        amount: params.amount,
        reference: depositInfo.reference,
        detail: {},
      };
      let deposit = await this.transactionService.depositByPaystack(
        newTransaction
      );
      return Utility.handleSuccess(res, "Transaction created successfully", {
        transaction: deposit,
        url: depositInfo.authorization_url,
      });
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR
      );
    }
  }
  async verifyPaystackDeposit(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      let transaction = await this.transactionService.fetchTransactionReference(
        params.reference
      );
      if (!transaction) {
        return Utility.handleError(
          res,
          "Invalid Transaction reference",
          ResponseCode.NOT_FOUND
        );
      }
      if (transaction.status != TransactionStatus.IN_PROGRESS) {
        return Utility.handleError(
          res,
          "Transaction status not supported",
          ResponseCode.NOT_FOUND
        );
      }

      const isValidPaymentTx = await PaymentService.verifyPaystackPayment(
        params.reference,
        transaction.amount
      );

      if (!isValidPaymentTx) {
        return Utility.handleError(
          res,
          "Email transaction reference",
          ResponseCode.NOT_FOUND
        );
      }

      const deposit = await this.deposit(
        transaction.accountId,
        transaction.id,
        transaction.amount
      );

      if (!deposit) {
        return Utility.handleError(
          res,
          "Deposit Failed",
          ResponseCode.NOT_FOUND
        );
      }

      return Utility.handleSuccess(res, "Deposit successfully", {
        transaction: deposit,
      });
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.SERVER_ERROR
      );
    }
  }
  async internalTransfer(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      const senderAccount = await this.accountService.getAccountByField({
        id: params.senderAccountId,
      });

      if (!senderAccount) {
        return Utility.handleError(
          res,
          "Invalid sender account",
          ResponseCode.NOT_FOUND
        );
      }
      if (senderAccount.balance <= params.amount) {
        return Utility.handleError(
          res,
          "insufficient balance",
          ResponseCode.BAD_REQUEST
        );
      }
      if (params.amount <= 0) {
        return Utility.handleError(
          res,
          "Amount must be above zero",
          ResponseCode.BAD_REQUEST
        );
      }

      const receiverAccount = await this.accountService.getAccountByField({
        accountNumber: params.receiverAccountNumber,
      });

      if (!receiverAccount) {
        return Utility.handleError(
          res,
          "invalid receiver account",
          ResponseCode.NOT_FOUND
        );
      }

      if (senderAccount.userId == receiverAccount.userId) {
        return Utility.handleError(
          res,
          "You cannot transfer to your own account",
          ResponseCode.BAD_REQUEST
        );
      }

      const result = await this.transfer(
        senderAccount,
        receiverAccount,
        params.account
      );

      if (!result.status) {
        return Utility.handleError(
          res,
          "Internal Transfer Failed",
          ResponseCode.BAD_REQUEST
        );
      }
      return Utility.handleSuccess(
        res,
        "Transfer was completed successfully",
        { transfer: result.transaction },
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
  async withdrawByPaystack(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      const senderAccount = await this.accountService.getAccountByField({
        id: params.senderAccountId,
      });

      if (!senderAccount) {
        return Utility.handleError(
          res,
          "Invalid sender account",
          ResponseCode.NOT_FOUND
        );
      }
      if (senderAccount.balance <= params.amount) {
        return Utility.handleError(
          res,
          "insufficient balance",
          ResponseCode.BAD_REQUEST
        );
      }

      if (params.amount <= 0) {
        return Utility.handleError(
          res,
          "Amount must be above zero",
          ResponseCode.BAD_REQUEST
        );
      }

      let payeeRecord = await this.payeeService.fetchPayeeAccountNumberAndBank(
        params.receiverAccountNumber,
        params.bankCode
      );
      let recipientID = "";
      if (!payeeRecord) {
        const paystackPayeeRecord = {
          accountNumber: params.receiverAccountNumber,
          accountName: params.receiverAccountNmae,
          bankCode: params.bankCode,
        };
        recipientID = (await PaymentService.createPayStackRecipient(
          paystackPayeeRecord
        )) as string;

        if (recipientID) {
          payeeRecord = await this.payeeService.savePayeeRecord({
            userId: params.user.id,
            accountName: params.receiverAccountName,
            accountNumber: params.receiverAccountNumber,
            bankCode: params.bankCode,
            detail: {
              paystackRecipientId: recipientID,
            },
          });
        } else {
          return Utility.handleError(
            res,
            "Invalid payment account, please try another payout method",
            ResponseCode.BAD_REQUEST
          );
        }
      } else {
        recipientID = payeeRecord.detail.paystackRecipientId as string;
      }

      const transferData = await PaymentService.initiatePaystackTransfer(
        recipientID,
        params.amount,
        params.message
      );

      if (!transferData) {
        return Utility.handleError(
          res,
          "Paystack Transfer Failed",
          ResponseCode.BAD_REQUEST
        );
      }

      const result = await this.transferToExternalAccount(
        senderAccount,
        params.receiverAccountNumber,
        transferData.reference,
        params.amount
      );

      if (!result.status) {
        return Utility.handleError(
          res,
          "Withdrawal transaction failed",
          ResponseCode.BAD_REQUEST
        );
      }

      return Utility.handleSuccess(
        res,
        "Transfer was initialized successfully",
        { transfer: result.transaction },
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

export default TransactionController;
