import { sendOrderMessage } from "../sqs";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { mockClient } from "aws-sdk-client-mock";

const sqsMock = mockClient(SQSClient);

describe("SQS Operations", () => {
  beforeEach(() => {
    sqsMock.reset();
    process.env.PAYMENT_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789/payment-queue";
    process.env.SHIPPING_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789/shipping-queue";
  });

  afterEach(() => {
    delete process.env.PAYMENT_QUEUE_URL;
    delete process.env.SHIPPING_QUEUE_URL;
  });

  test("sendOrderMessage sends to payment queue", async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-123" });

    await sendOrderMessage({ orderId: "test-order" }, "payment");

    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
  });

  test("sendOrderMessage sends to shipping queue", async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-456" });

    await sendOrderMessage({ orderId: "test-order" }, "shipping");

    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
  });

  test("sendOrderMessage includes orderId in attributes", async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "msg-789" });

    await sendOrderMessage({ orderId: "test-order-123" }, "payment");

    const call = sqsMock.commandCalls(SendMessageCommand)[0];
    expect(call.args[0].input.MessageAttributes?.orderId?.StringValue).toBe("test-order-123");
  });
});
