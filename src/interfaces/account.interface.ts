import { Optional, Model, FindOptions, Transaction } from "sequelize";

export interface IAccount {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFindAccountQuery {
  where: {
    [key: string]: string;
  };
  transaction?: Transaction;
  raw?: boolean;
  returning?: boolean;
}

export interface IAccountCreationBody
  extends Optional<IAccount, "id" | "createdAt" | "updatedAt"> {}

export interface IAccountModel
  extends Model<IAccount, IAccountCreationBody>,
    IAccount {}

export interface IAccountDataSource {
  fetchOne(query: IFindAccountQuery): Promise<IAccount | null>;
  create(record: IAccountCreationBody): Promise<IAccount>;
  updateOne(
    searchBy: IFindAccountQuery,
    data: Partial<IAccount>
  ): Promise<void>;
  fetchAll(query: FindOptions<IAccount>): Promise<IAccount[]>;
}
