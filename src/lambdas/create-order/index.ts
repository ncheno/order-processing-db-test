import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createOrder } from "../common/dynamodb";
import { sendOrderMessage } from "../common/sqs";
import { v4 as uuidv4 } from "uuid";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("Received order creation request");

    let orderData: any = {};
    if (event.body) {
      try {
        orderData = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Invalid JSON in request body" }),
        };
      }
    }

    const orderId = orderData.orderId || uuidv4();

    const order = await createOrder(orderId, orderData);
    console.log(`Order created: ${orderId}`);

    await sendOrderMessage({ orderId }, "payment");
    await sendOrderMessage({ orderId }, "shipping");
    console.log(`Order messages sent for: ${orderId}`);

    return {
      statusCode: 202,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        status: "PENDING",
        message: "Order received and queued for processing",
      }),
    };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
