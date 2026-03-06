import { Handler } from "aws-lambda";
import { completeOrder as completeOrderInDB } from "../common/dynamodb";

interface CompleteOrderEvent {
  orderId: string;
}

export const handler: Handler<CompleteOrderEvent> = async (event) => {
  try {
    const { orderId } = event;
    console.log(`Completing order ${orderId}`);

    await completeOrderInDB(orderId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Order completed", orderId }),
    };
  } catch (error: any) {
    console.error("Error completing order:", error);
    throw error;
  }
};
