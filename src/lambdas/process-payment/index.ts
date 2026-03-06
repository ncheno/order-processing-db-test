import { SQSHandler } from "aws-lambda";
import { getOrder, updatePaymentStatus, completeOrder } from "../common/dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({ region: "us-east-1" });

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      const orderId = payload.orderId;

      console.log(`Processing payment for order ${orderId}`);

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await updatePaymentStatus(orderId, "PAID");
      console.log(`Payment PAID for order ${orderId}`);

      // Check if order can be completed
      const order = await getOrder(orderId);
      if (
        order &&
        order.paymentStatus === "PAID" &&
        order.shippingStatus === "SHIPPED"
      ) {
        const command = new InvokeCommand({
          FunctionName: "complete-order",
          InvocationType: "Event",
          Payload: JSON.stringify({ orderId }),
        });
        await lambdaClient.send(command);
      }
    } catch (error) {
      console.error(`Error processing payment:`, error);
      throw error;
    }
  }
};
