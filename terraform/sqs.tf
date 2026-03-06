resource "aws_sqs_queue" "payment_queue" {
  name                       = "payment-queue"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 300

  tags = {
    Name = "PaymentQueue"
  }
}

resource "aws_sqs_queue" "payment_queue_dlq" {
  name                      = "payment-queue-dlq"
  message_retention_seconds = 1209600

  tags = {
    Name = "PaymentQueueDLQ"
  }
}

resource "aws_sqs_queue" "shipping_queue" {
  name                       = "shipping-queue"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 300

  tags = {
    Name = "ShippingQueue"
  }
}

resource "aws_sqs_queue" "shipping_queue_dlq" {
  name                      = "shipping-queue-dlq"
  message_retention_seconds = 1209600

  tags = {
    Name = "ShippingQueueDLQ"
  }
}

resource "aws_sqs_queue_redrive_policy" "payment_queue_redrive" {
  queue_url = aws_sqs_queue.payment_queue.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_queue_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_redrive_policy" "shipping_queue_redrive" {
  queue_url = aws_sqs_queue.shipping_queue.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.shipping_queue_dlq.arn
    maxReceiveCount     = 3
  })
}
