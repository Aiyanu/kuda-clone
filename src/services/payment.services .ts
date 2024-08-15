import axios from "axios";
import { IPaystackPaymentObject } from "../interfaces/transaction.interface";
import { v4 as uuidv4 } from "uuid";

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
}

export default PaymentService;
