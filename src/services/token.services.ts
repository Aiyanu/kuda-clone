import moment from "moment";
import {
  IFindTokenQuery,
  IToken,
  ITokenCreationBody,
} from "../interfaces/token.interface";
import Utility from "../utils/index.utils";
import { autoInjectable } from "tsyringe";
import TokenDataSource from "../datasources/token.datasource";

@autoInjectable()
class TokenService {
  private tokenDataSource: TokenDataSource;
  private readonly tokenExpires: number = 5;
  public TokenType = {
    FORGOT_PASSWORD: "FORGOT_PASSWORD",
  };
  public TokenStatus = {
    NOT_USED: "NOT_USED",
    USED: "USED",
  };
  public IsTokenVerified = {
    VERIFIED: "VERIFIED",
    NOT_VERIFIED: "NOT_VERIFIED",
  };

  constructor(_tokenDataSource: TokenDataSource) {
    this.tokenDataSource = _tokenDataSource;
  }

  async getTokenByField(record: Partial<IToken>): Promise<IToken | null> {
    const query = { where: { ...record }, raw: true } as IFindTokenQuery;
    return this.tokenDataSource.fetchOne(query);
  }

  async createForgotPasswordToken(email: string): Promise<IToken | null> {
    const tokenData = {
      key: email,
      type: this.TokenType.FORGOT_PASSWORD,
      expires: moment().add(this.tokenExpires, "minute").toDate(),
      status: this.TokenStatus.NOT_USED,
      verified: this.IsTokenVerified.NOT_VERIFIED,
    } as ITokenCreationBody;
    let token = await this.createToken(tokenData);
    return token;
  }
  async createToken(record: ITokenCreationBody) {
    const tokenData = { ...record };
    let validCode = false;
    while (!validCode) {
      tokenData.code = Utility.generateCode(6);
      const isCodeExist = await this.getTokenByField({ code: tokenData.code });
      if (!isCodeExist) {
        validCode = true;
        break;
      }
    }
    return this.tokenDataSource.create(tokenData);
  }

  async updateRecord(
    searchBy: Partial<IToken>,
    record: Partial<IToken>
  ): Promise<void> {
    const query = { where: { ...searchBy }, raw: true } as IFindTokenQuery;
    await this.tokenDataSource.updateOne(record, query);
  }
}

export default TokenService;
