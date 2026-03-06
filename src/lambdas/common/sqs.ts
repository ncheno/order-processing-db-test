import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: "us-east-1" });

export async function sendOrderMessage(payload: any, queueType: "payment" | "shipping"): Promise<void> {
  const queueUrl = queueType === "payment"
    ? process.env.PAYMENT_QUEUE_URL
    : process.env.SHIPPING_QUEUE_URL;

  if (!queueUrl) {
    throw new Error(`Queue URL not configured for ${queueType}`);
  }

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(payload),
    MessageAttributes: {
      orderId: {
        StringValue: payload.orderId,
        DataType: "String",
      },
    },
  });

  try {
    await sqsClient.send(command);
    console.log(`Message sent to ${queueType}-queue for order ${payload.orderId}`);
  } catch (error) {
    console.error(`Failed to send message to ${queueType}-queue:`, error);
    throw error;
  }
}
