import axios from "axios";
import {
  IPaystackInitTransferObject,
  IPaystackPaymentObject,
} from "../interfaces/transaction.interface";
import { v4 as uuidv4 } from "uuid";
import { IPayeePaystackDetail } from "../interfaces/payee.interface";

class PaymentService {
  private static generatePaystackReference(): string {
    return uuidv4();
  }

  public static async generatePaystackPaymentUrl(
    email: string,
    amount: number
  ): Promise<IPaystackPaymentObject | null> {
    try {
      const amountInKobo = amount * 100;
      const params = {
        email,
        amount: amountInKobo,
        channels: ["card", "bank_transfer"],
        callback_url: `${process.env.PAYSTACK_CALLBACK_URL}`,
        reference: this.generatePaystackReference(),
      };
      const config = {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };
      const { data } = await axios.post(
        `https://api.paystack.co/transaction/initialize`,
        params,
        config
      );

      if (data && data.status) {
        return data.data;
      }
      return null;
    } catch (err) {
      return null;
    }
  }
  public static async verifyPaystackPayment(
    reference: string,
    amount: number
  ): Promise<Boolean> {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };
      const { data } = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        config
      );

      if (data && data.status) {
        const { amount: amountInKobo } = data.data;
        if (amountInKobo != amount * 100) {
          return false;
        }
        return true;
      }

      return false;
    } catch (err) {
      return false;
    }
  }
  public static async createPayStackRecipient(
    userRecord: IPayeePaystackDetail
  ): Promise<string | null> {
    try {
      const params = {
        type: "nuban",
        name: userRecord.accountName,
        account_number: userRecord.accountNumber,
        bank_code: userRecord.bankCode,
        currency: "NGN",
      };

      const { data } = await axios.post(
        `https://api.paystack.co/transferrecipient`,
        params,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (data && data.status) {
        return data.data.recipient_code;
      }
      return null;
    } catch (err) {
      return null;
    }
  }
  public static async initiatePaystackTransfer(
    recipient: string,
    amount: number,
    message: string
  ): Promise<IPaystackInitTransferObject | null> {
    try {
      const params = {
        source: "balance",
        reason: message,
        amount: amount * 100,
        recipient,
        reference: this.generatePaystackReference(),
        currency: "NGN",
      };

      const { data } = await axios.post(
        `https://api.paystack.co/transfer`,
        params,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (data && data.status) {
        return {
          reference: params.reference,
          transferCode: data.data.transfer_code,
        };
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}

export default PaymentService;
