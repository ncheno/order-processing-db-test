import { handler } from "../index";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe("complete-order Lambda", () => {
  beforeEach(() => {
    dynamoMock.reset();
    process.env.ORDERS_TABLE = "orders";
  });

  afterEach(() => {
    delete process.env.ORDERS_TABLE;
  });

  test("completes order successfully", async () => {
    dynamoMock.on(UpdateCommand).resolves({});

    const event = { orderId: "test-order-789" };

    const result = await (handler as any)(event);

    expect(result?.statusCode).toBe(200);
    expect(dynamoMock.commandCalls(UpdateCommand)).toHaveLength(1);
  });

  test("returns order ID in response", async () => {
    dynamoMock.on(UpdateCommand).resolves({});

    const event = { orderId: "test-order-790" };

    const result = await (handler as any)(event);
    const body = JSON.parse(result?.body || "{}");

    expect(body.orderId).toBe("test-order-790");
  });

  test("handles errors gracefully", async () => {
    dynamoMock.on(UpdateCommand).rejects(new Error("DynamoDB Error"));

    const event = { orderId: "test-order-791" };

    await expect((handler as any)(event)).rejects.toThrow();
  });
});
