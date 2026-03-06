import { handler } from "../index";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { mockClient } from "aws-sdk-client-mock";

const dynamoMock = mockClient(DynamoDBDocumentClient);
const lambdaMock = mockClient(LambdaClient);

describe("process-shipping Lambda", () => {
  beforeEach(() => {
    dynamoMock.reset();
    lambdaMock.reset();
    process.env.ORDERS_TABLE = "orders";
    process.env.COMPLETE_ORDER_FUNCTION = "complete-order";
  });

  afterEach(() => {
    delete process.env.ORDERS_TABLE;
    delete process.env.COMPLETE_ORDER_FUNCTION;
  });

  test("updates shipping status to SHIPPED", async () => {
    dynamoMock.on(UpdateCommand).resolves({});
    dynamoMock.on(GetCommand).resolves({ Item: { orderId: "test-order-456", shippingStatus: "PENDING" } });

    const event = {
      Records: [
        {
          body: JSON.stringify({ orderId: "test-order-456" }),
        },
      ],
    } as any;

    await (handler as any)(event);

    expect(dynamoMock.commandCalls(UpdateCommand)).toHaveLength(1);
  });

  test("invokes complete-order when both statuses are ready", async () => {
    dynamoMock.on(UpdateCommand).resolves({});
    dynamoMock.on(GetCommand).resolves({
      Item: {
        orderId: "test-order-457",
        paymentStatus: "PAID",
        shippingStatus: "SHIPPED",
      },
    });
    lambdaMock.on(InvokeCommand).resolves({});

    const event = {
      Records: [
        {
          body: JSON.stringify({ orderId: "test-order-457" }),
        },
      ],
    } as any;

    await (handler as any)(event);

    expect(lambdaMock.commandCalls(InvokeCommand)).toHaveLength(1);
  });

  test("handles empty records", async () => {
    const event = { Records: [] } as any;

    await expect((handler as any)(event)).resolves.not.toThrow();
  });
});
