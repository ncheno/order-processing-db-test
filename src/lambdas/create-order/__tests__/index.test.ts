import { handler } from "../index";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { mockClient } from "aws-sdk-client-mock";

const dynamoMock = mockClient(DynamoDBDocumentClient);
const sqsMock = mockClient(SQSClient);

describe("create-order Lambda", () => {
  beforeEach(() => {
    dynamoMock.reset();
    sqsMock.reset();
    process.env.ORDERS_TABLE = "orders";
    process.env.PAYMENT_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789/payment-queue";
    process.env.SHIPPING_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789/shipping-queue";
  });

  afterEach(() => {
    delete process.env.ORDERS_TABLE;
    delete process.env.PAYMENT_QUEUE_URL;
    delete process.env.SHIPPING_QUEUE_URL;
  });

  test("creates order with orderId from request", async () => {
    dynamoMock.on(PutCommand).resolves({});
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-1" });

    const event = {
      body: JSON.stringify({ orderId: "my-order-123", customerName: "John" }),
    } as any;

    const result = await (handler as any)(event);

    expect(result?.statusCode).toBe(202);
    expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(1);
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(2);
  });

  test("creates order with auto-generated orderId", async () => {
    dynamoMock.on(PutCommand).resolves({});
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-2" });

    const event = {
      body: JSON.stringify({ customerName: "Jane" }),
    } as any;

    const result = await (handler as any)(event);

    expect(result?.statusCode).toBe(202);
    const bodyParsed = JSON.parse(result?.body || "{}");
    expect(bodyParsed.orderId).toBeDefined();
  });

  test("handles missing request body", async () => {
    dynamoMock.on(PutCommand).resolves({});
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-3" });

    const event = { body: undefined } as any;

    const result = await (handler as any)(event);

    expect(result?.statusCode).toBe(202);
  });

  test("returns 400 on invalid JSON", async () => {
    const event = { body: "invalid json" } as any;

    const result = await (handler as any)(event);

    expect(result?.statusCode).toBe(400);
  });

  test("publishes to both queues", async () => {
    dynamoMock.on(PutCommand).resolves({});
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-4" });

    const event = {
      body: JSON.stringify({ orderId: "order-123" }),
    } as any;

    await (handler as any)(event);

    const sqsCalls = sqsMock.commandCalls(SendMessageCommand);
    expect(sqsCalls).toHaveLength(2);
  });

  test("returns 202 status with PENDING status", async () => {
    dynamoMock.on(PutCommand).resolves({});
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-5" });

    const event = {
      body: JSON.stringify({ orderId: "order-456", customerId: "cust-123" }),
    } as any;

    const result = await (handler as any)(event);

    expect(result?.statusCode).toBe(202);
    const body = JSON.parse(result?.body || "{}");
    expect(body.status).toBe("PENDING");
    expect(body.message).toBe("Order received and queued for processing");
  });
});
