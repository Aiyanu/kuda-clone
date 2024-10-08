import moment from "moment";
import {
  IFindTokenQuery,
  IToken,
  ITokenCreationBody,
  ITokenDataSource,
} from "../interfaces/token.interface";
import Utility from "../utils/index.utils";

class TokenService {
  private tokenDataSource: ITokenDataSource;
  private readonly tokenExpires: number = 5;
  public TokenType = {
    FORGOT_PASSWORD: "FORGOT_PASSWORD",
  };
  public TokenStatus = {
    NOTUSED: "NOTUSED",
    USED: "USED",
  };

  constructor(_tokenDataSource: ITokenDataSource) {
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
      status: this.TokenStatus.NOTUSED,
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
