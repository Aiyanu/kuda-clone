import db from "./index";
import UserModel from "../models/user.model";
import TokenModel from "../models/token.model";
import AccountModel from "../models/account.model";

const DBInitialize = async () => {
  try {
    await db.authenticate();
    UserModel.sync({ alter: false });
    TokenModel.sync({ alter: false });
    AccountModel.sync({ alter: false });
  } catch (err) {
    console.log(err);
  }
};

export default DBInitialize;
