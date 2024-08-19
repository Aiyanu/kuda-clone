import { FindOptions } from "sequelize";
import {
  IFindPayeeQuery,
  IPayee,
  IPayeeCreationBody,
  IPayeeDataSource,
} from "../interfaces/payee.interface";
import PayeeModel from "../models/payee.model";

class PayeeDataSource implements IPayeeDataSource {
  async create(
    record: IPayeeCreationBody,
    options?: Partial<IFindPayeeQuery>
  ): Promise<IPayee> {
    return await PayeeModel.create(record, {
      returning: true,
      ...options,
    });
  }

  async fetchOne(query: IFindPayeeQuery): Promise<IPayee | null> {
    return await PayeeModel.findOne(query);
  }

  async updateOne(
    data: Partial<IPayee>,
    query: IFindPayeeQuery
  ): Promise<void> {
    await PayeeModel.update(data, query);
  }

  async fetchAll(query: FindOptions<IPayee>): Promise<IPayee[]> {
    return await PayeeModel.findAll(query);
  }
}

export default PayeeDataSource;
