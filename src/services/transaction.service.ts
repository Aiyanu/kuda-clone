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

class TransactionService {
  private transactionDataSource: ITransactionDataSource;

  constructor(_transactionDataSource: ITransactionDataSource) {
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
}

export default TransactionService;
