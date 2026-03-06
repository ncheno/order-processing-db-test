import { createOrder, getOrder, updatePaymentStatus, updateShippingStatus, completeOrder } from "../dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe("DynamoDB Operations", () => {
  beforeEach(() => {
    dynamoMock.reset();
    process.env.ORDERS_TABLE = "orders";
  });

  afterEach(() => {
    delete process.env.ORDERS_TABLE;
  });

  test("createOrder saves order to DynamoDB", async () => {
    dynamoMock.on(PutCommand).resolves({});

    const order = await createOrder("test-order-1", { customerName: "John" });

    expect(order.orderId).toBe("test-order-1");
    expect(order.status).toBe("PENDING");
    expect(order.customerName).toBe("John");
    expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  test("getOrder retrieves order from DynamoDB", async () => {
    dynamoMock.on(GetCommand).resolves({
      Item: {
        orderId: "test-order-2",
        status: "PENDING",
        paymentStatus: "PENDING",
        shippingStatus: "PENDING",
      },
    });

    const order = await getOrder("test-order-2");

    expect(order?.orderId).toBe("test-order-2");
    expect(order?.status).toBe("PENDING");
  });

  test("updatePaymentStatus updates payment status", async () => {
    dynamoMock.on(UpdateCommand).resolves({});

    await updatePaymentStatus("test-order-3", "PAID");

    const calls = dynamoMock.commandCalls(UpdateCommand);
    expect(calls).toHaveLength(1);
  });

  test("updateShippingStatus updates shipping status", async () => {
    dynamoMock.on(UpdateCommand).resolves({});

    await updateShippingStatus("test-order-4", "SHIPPED");

    const calls = dynamoMock.commandCalls(UpdateCommand);
    expect(calls).toHaveLength(1);
  });

  test("completeOrder sets status to COMPLETED", async () => {
    dynamoMock.on(UpdateCommand).resolves({});

    await completeOrder("test-order-5");

    const calls = dynamoMock.commandCalls(UpdateCommand);
    expect(calls).toHaveLength(1);
  });
});
