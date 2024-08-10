import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import JWT from "jsonwebtoken";
import UserService from "../services/user.services";
import {
  AccountStatus,
  EmailStatus,
  UserRoles,
} from "../interfaces/enum/user.enum";
import { IUserCreationBody } from "../interfaces/user.interface";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interfaces/enum/code.emum";
import TokenService from "../services/token.services";
import { IToken } from "../interfaces/token.interface";
import EmailService from "../services/email.service";

class UserController {
  private userService: UserService;
  private tokenService: TokenService;

  constructor(_userService: UserService, _tokenService: TokenService) {
    this.userService = _userService;
    this.tokenService = _tokenService;
  }

  async register(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      const newUser = {
        firstname: params.firstname,
        lastname: params.lastname,
        email: params.email,
        username: params.email.split("@")[0],
        password: params.password,
        role: UserRoles.CUSTOMER,
        accountStatus: AccountStatus.ACTIVE,
        isEmailVerified: EmailStatus.NOT_VERIFIED,
      } as IUserCreationBody;
      newUser.password = bcrypt.hashSync(newUser.password, 10);

      let userExists = await this.userService.getUserByField({
        email: newUser.email,
      });
      if (userExists) {
        return Utility.handleError(
          res,
          "Email already exists",
          ResponseCode.ALREADY_EXISTS
        );
      }

      let user = await this.userService.createUser(newUser);
      user.password = "";
      return Utility.handleSuccess(
        res,
        "User registered successfully",
        { user },
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

  async login(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      let user = await this.userService.getUserByField({ email: params.email });
      if (!user) {
        return Utility.handleError(
          res,
          "Invalid login details",
          ResponseCode.NOT_FOUND
        );
      }
      let isPasswordMatch = await bcrypt.compare(
        params.password,
        user.password
      );
      if (!isPasswordMatch) {
        return Utility.handleError(
          res,
          "Invalid login details",
          ResponseCode.NOT_FOUND
        );
      }

      const token = JWT.sign(
        {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_KEY as string,
        {
          expiresIn: "30d",
        }
      );

      return Utility.handleSuccess(
        res,
        "Login Successful",
        { user, token },
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

  async forgotPassword(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      let user = await this.userService.getUserByField({ email: params.email });
      if (!user) {
        return Utility.handleError(
          res,
          "Account Does not Exist",
          ResponseCode.NOT_FOUND
        );
      }
      const token = (await this.tokenService.createForgotPasswordToken(
        params.email
      )) as IToken;
      await EmailService.sendForgotPasswordMail(params.email, token.code);
      return Utility.handleSuccess(
        res,
        "Password reset code has been sent to your mail",
        {},
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

  async resetPassword(req: Request, res: Response) {
    try {
      res.json({ msg: "Reset password successful" });
    } catch (error) {
      res.json({ msg: "Server Error", error });
    }
  }
}

export default UserController;
