import { NextFunction, Request, Response } from "express";
import { Schema } from "yup";
import Utility from "../utils/index.utils";
import { ResponseCode } from "../interfaces/enum/code.enum";
import JWT from "jsonwebtoken";
import { IUser } from "../interfaces/user.interface";
import { userService } from "../routers/user.router";

export const validator = (schema: Schema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate(req.body, { abortEarly: false });
      next();
    } catch (error: any) {
      return Utility.handleError(
        res,
        error.errors[0],
        ResponseCode.BAD_REQUEST
      );
    }
  };
};

export const Auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token: string = req.headers.authorization ?? "";
      if (Utility.isEmpty(token)) {
        throw new TypeError("Authorization Failed");
      }
      token = token.split(" ")[1];
      const decoded = JWT.verify(token, process.env.JWT_KEY as string) as IUser;
      if (decoded && decoded.id) {
        const user = await userService.getUserByField({ id: decoded.id });
        if (!user) {
          throw new TypeError("Authorization Failed");
        }
        if (user.accountStatus == "DELETED") {
          throw new TypeError("Authorization failed");
        }

        req.body.user = decoded;
        next();
      } else {
        throw new TypeError("Authorization Failed");
      }
    } catch (error) {
      return Utility.handleError(
        res,
        (error as TypeError).message,
        ResponseCode.BAD_REQUEST
      );
    }
  };
};
