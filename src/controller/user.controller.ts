import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import JWT from "jsonwebtoken";
import UserService from "../services/user.service";
import {
  AccountStatus,
  EmailStatus,
  UserRoles,
} from "../interfaces/enum/user.enum";
import { IUserCreationBody } from "../interfaces/user.interface";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interfaces/enum/code.enum";
import TokenService from "../services/token.services";
import { IToken } from "../interfaces/token.interface";
import EmailService from "../services/email.service";
import moment from "moment";
import { autoInjectable } from "tsyringe";
import Permissions from "../permissions";

@autoInjectable()
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

  async verifyToken(req: Request, res: Response) {
    try {
      const body = { ...req.body };
      let isValidToken = await this.tokenService.getTokenByField({
        key: body.email,
        code: body.code,
        type: this.tokenService.TokenType.FORGOT_PASSWORD,
        status: this.tokenService.TokenStatus.NOT_USED,
      });
      if (!isValidToken) {
        return Utility.handleError(
          res,
          "Token doesn't exist",
          ResponseCode.NOT_FOUND
        );
      }
      if (
        isValidToken &&
        moment(isValidToken.expires).diff(moment(), "minute") <= 0
      ) {
        return Utility.handleError(
          res,
          "Token has expired",
          ResponseCode.NOT_FOUND
        );
      }
      await this.tokenService.updateRecord(
        { id: isValidToken.id },
        { verified: this.tokenService.IsTokenVerified.VERIFIED }
      );
      return Utility.handleSuccess(
        res,
        "token verified",
        {},
        ResponseCode.SUCCESS
      );
    } catch (err) {
      return Utility.handleError(
        res,
        (err as TypeError).message,
        ResponseCode.BAD_REQUEST
      );
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const body = { ...req.body };
      let isValidToken = await this.tokenService.getTokenByField({
        key: body.email,
        code: body.code,
        type: this.tokenService.TokenType.FORGOT_PASSWORD,
        status: this.tokenService.TokenStatus.NOT_USED,
        verified: this.tokenService.IsTokenVerified.VERIFIED,
      });
      if (!isValidToken) {
        return Utility.handleError(
          res,
          "Token has expired",
          ResponseCode.NOT_FOUND
        );
      }
      if (
        isValidToken &&
        moment(isValidToken.expires).diff(moment(), "minute") <= 0
      ) {
        return Utility.handleError(
          res,
          "Token has expired",
          ResponseCode.NOT_FOUND
        );
      }
      let user = await this.userService.getUserByField({ email: body.email });
      if (!user) {
        return Utility.handleError(
          res,
          "Invalid User Record",
          ResponseCode.NOT_FOUND
        );
      }

      const _password = bcrypt.hashSync(body.password, 10);

      await this.userService.updateRecord(
        { id: user.id },
        { password: _password }
      );
      await this.tokenService.updateRecord(
        { id: isValidToken.id },
        { status: this.tokenService.TokenStatus.USED }
      );
      return Utility.handleSuccess(
        res,
        "Password reset Successful",
        {},
        ResponseCode.SUCCESS
      );
    } catch (error) {
      res.json({ msg: "Server Error", error });
    }
  }

  async getAllUsersByAdmin(req: Request, res: Response) {
    try {
      const admin = { ...req.body.user };
      const permission = Permissions.can(admin.role).readAny("users");
      if (!permission.granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.NOT_FOUND
        );
      }

      let users = await this.userService.getAllUsers();
      if (users && users.length > 0) {
        users = users.map((user) => {
          user.password = "";
          return user;
        });
      }
      return Utility.handleSuccess(
        res,
        "User Fetched successfully",
        { users },
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
  async getSingleUserId(req: Request, res: Response) {
    try {
      const params = { ...req.params };
      const admin = { ...req.body.user };

      const permission = Permissions.can(admin.role).readAny("users");
      if (!permission.granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.NOT_FOUND
        );
      }

      let user = await this.userService.getUserByField({
        id: Utility.escapeHtml(params.id),
      });
      if (!user) {
        return Utility.handleError(
          res,
          "User does not exist",
          ResponseCode.NOT_FOUND
        );
      }
      user.password = "";
      return Utility.handleSuccess(
        res,
        "User Fetched successfully",
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
  async setAccountStatus(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      const admin = { ...req.body.user };
      const permission = Permissions.can(admin.role).updateAny("users");

      if (!permission.granted) {
        return Utility.handleError(
          res,
          "Invalid Permission",
          ResponseCode.NOT_FOUND
        );
      }

      let user = await this.userService.getUserByField({
        id: Utility.escapeHtml(params.userId),
      });
      if (!user) {
        return Utility.handleError(
          res,
          "User does not exist",
          ResponseCode.NOT_FOUND
        );
      }
      await this.userService.updateRecord(
        {
          id: user.id,
        },
        { accountStatus: params.status }
      );
      return Utility.handleSuccess(
        res,
        "User Fetched successfully",
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
  async getProfile(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      let user = await this.userService.getUserByField({ id: params.user.id });
      if (!user) {
        return Utility.handleError(
          res,
          "User does not exist",
          ResponseCode.NOT_FOUND
        );
      }
      user.password = "";
      return Utility.handleSuccess(
        res,
        "User fetched successfully",
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
}

export default UserController;
