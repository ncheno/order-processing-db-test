import { SQSHandler } from "aws-lambda";
import { getOrder, updateShippingStatus, completeOrder } from "../common/dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({ region: "us-east-1" });

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      const orderId = payload.orderId;

      console.log(`Processing shipping for order ${orderId}`);

      // Simulate shipping processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await updateShippingStatus(orderId, "SHIPPED");
      console.log(`Shipping SHIPPED for order ${orderId}`);

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
      console.error(`Error processing shipping:`, error);
      throw error;
    }
  }
};
