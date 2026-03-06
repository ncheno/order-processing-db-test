import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Order } from "./types";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.ORDERS_TABLE || "orders";

export async function createOrder(orderId: string, orderData?: any): Promise<Order> {
  const now = Date.now();
  const order: Order = {
    orderId,
    status: "PENDING",
    paymentStatus: "PENDING",
    shippingStatus: "PENDING",
    createdAt: now,
    updatedAt: now,
    ...(orderData || {}),
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: order,
    ConditionExpression: "attribute_not_exists(orderId)",
  });

  try {
    await docClient.send(command);
    console.log(`Order created: ${orderId}`);
    return order;
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      console.log(`Order ${orderId} already exists, returning existing order`);
      const existing = await getOrder(orderId);
      return existing as Order;
    }
    console.error("Failed to create order:", error);
    throw error;
  }
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { orderId },
  });

  try {
    const response = await docClient.send(command);
    return response.Item as Order || null;
  } catch (error) {
    console.error("Failed to get order:", error);
    throw error;
  }
}

export async function updatePaymentStatus(orderId: string, status: string): Promise<void> {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { orderId },
    UpdateExpression: "SET paymentStatus = :paymentStatus, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":paymentStatus": status,
      ":updatedAt": Date.now(),
    },
    ConditionExpression: "attribute_exists(orderId)",
  });

  try {
    await docClient.send(command);
    console.log(`Payment status updated for order ${orderId}: ${status}`);
  } catch (error) {
    console.error("Failed to update payment status:", error);
    throw error;
  }
}

export async function updateShippingStatus(orderId: string, status: string): Promise<void> {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { orderId },
    UpdateExpression: "SET shippingStatus = :shippingStatus, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":shippingStatus": status,
      ":updatedAt": Date.now(),
    },
    ConditionExpression: "attribute_exists(orderId)",
  });

  try {
    await docClient.send(command);
    console.log(`Shipping status updated for order ${orderId}: ${status}`);
  } catch (error) {
    console.error("Failed to update shipping status:", error);
    throw error;
  }
}

export async function completeOrder(orderId: string): Promise<void> {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { orderId },
    UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ConditionExpression: "attribute_exists(orderId) AND paymentStatus = :paid AND shippingStatus = :shipped",
    ExpressionAttributeValues: {
      ":status": "COMPLETED",
      ":updatedAt": Date.now(),
      ":paid": "PAID",
      ":shipped": "SHIPPED",
    },
  });

  try {
    await docClient.send(command);
    console.log(`Order completed: ${orderId}`);
  } catch (error) {
    console.error("Failed to complete order:", error);
    throw error;
  }
}
