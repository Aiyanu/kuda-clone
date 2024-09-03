import { v4 as uuidv4 } from "uuid";
import {
  TransactionGateway,
  TransactionStatus,
  TransactionTypes,
} from "../interfaces/enum/transaction.enum";
import {
  IFindTransactionQuery,
  ITransaction,
  ITransactionCreationBody,
  ITransactionDataSource,
} from "../interfaces/transaction.interface";
import TransactionDataSource from "../datasources/transaction.datasource";
import { autoInjectable } from "tsyringe";

@autoInjectable()
class TransactionService {
  private transactionDataSource: TransactionDataSource;

  constructor(_transactionDataSource: TransactionDataSource) {
    this.transactionDataSource = _transactionDataSource;
  }

  async fetchTransactionReference(
    reference: string
  ): Promise<ITransaction | null> {
    const query = {
      where: { reference },
      raw: true,
    };
    return this.transactionDataSource.fetchOne(query);
  }

  async depositByPaystack(data: Partial<ITransaction>): Promise<ITransaction> {
    const deposit = {
      ...data,
      type: TransactionTypes.DEPOSIT,
      detail: {
        ...data.detail,
        gateway: TransactionGateway.PAYSTACK,
      },
      status: TransactionStatus.IN_PROGRESS,
    } as ITransactionCreationBody;
    return this.transactionDataSource.create(deposit);
  }

  private generatePaymentReference(): string {
    return uuidv4();
  }
  async setStatus(
    transactionId: string,
    status: string,
    options: Partial<IFindTransactionQuery> = {}
  ): Promise<void> {
    const filter = { where: { id: transactionId }, ...options };
    const update = {
      status,
    };
    await this.transactionDataSource.updateOne(update as any, filter);
  }
  async processInternalTransfer(
    data: Partial<ITransaction>,
    options: Partial<IFindTransactionQuery> = {}
  ): Promise<ITransaction> {
    const record = {
      ...data,
      type: TransactionTypes.TRANSFER,
      reference: this.generatePaymentReference(),
      detail: {
        ...data.detail,
        gateway: TransactionGateway.PAYSTACK,
      },
      status: TransactionStatus.COMPLETED,
    } as ITransactionCreationBody;
    return this.transactionDataSource.create(record);
  }
  async processExternalTransfer(
    data: Partial<ITransaction>,
    options: Partial<IFindTransactionQuery> = {}
  ): Promise<ITransaction> {
    const record = {
      ...data,
      type: TransactionTypes.TRANSFER,
      detail: {
        gateway: TransactionGateway.PAYSTACK,
      },
      status: TransactionStatus.IN_PROGRESS,
    } as ITransactionCreationBody;
    return this.transactionDataSource.create(record);
  }

  async getTransactions(): Promise<ITransaction[]> {
    const query = { where: {}, raw: true };
    return this.transactionDataSource.fetchAll(query);
  }

  async getTransactionsByField(
    record: Partial<ITransaction>
  ): Promise<ITransaction[]> {
    const query = { where: { ...record }, raw: true } as IFindTransactionQuery;
    return this.transactionDataSource.fetchAll(query);
  }
  async getTransactionByField(
    record: Partial<ITransaction>
  ): Promise<ITransaction | null> {
    const query = { where: { ...record }, raw: true } as IFindTransactionQuery;
    return this.transactionDataSource.fetchOne(query);
  }
  async getTransactionSum(
    field: keyof ITransaction,
    record: Partial<ITransaction>
  ): Promise<number> {
    const query = { where: { ...record }, raw: true } as IFindTransactionQuery;
    return this.transactionDataSource.fetchSum(field, query);
  }
}

export default TransactionService;
