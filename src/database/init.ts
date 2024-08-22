import db from "./index";
import UserModel from "../models/user.model";
import TokenModel from "../models/token.model";
import AccountModel from "../models/account.model";
import TransactionModel from "../models/transaction.model";
import PayeeModel from "../models/payee.model";
import LoanModel from "../models/loan.model";

const DBInitialize = async () => {
  try {
    await db.authenticate();
    UserModel.sync({ alter: false });
    TokenModel.sync({ alter: false });
    AccountModel.sync({ alter: false });
    TransactionModel.sync({ alter: false });
    PayeeModel.sync({ alter: false });
    LoanModel.sync({ alter: false });
  } catch (err) {
    console.log(err);
  }
};

export default DBInitialize;
