resource "aws_iam_role" "create_order_role" {
  name = "create-order-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "create_order_policy" {
  name = "create-order-policy"
  role = aws_iam_role.create_order_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.orders.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.payment_queue.arn,
          aws_sqs_queue.shipping_queue.arn
        ]
      }
    ]
  })
}

resource "aws_lambda_function" "create_order" {
  filename         = "lambda-builds/create-order.zip"
  function_name    = "create-order"
  role             = aws_iam_role.create_order_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("lambda-builds/create-order.zip")
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      ORDERS_TABLE       = aws_dynamodb_table.orders.name
      PAYMENT_QUEUE_URL  = aws_sqs_queue.payment_queue.url
      SHIPPING_QUEUE_URL = aws_sqs_queue.shipping_queue.url
    }
  }
}

# ===== process-payment Lambda =====

resource "aws_iam_role" "process_payment_role" {
  name = "process-payment-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "process_payment_policy" {
  name = "process-payment-policy"
  role = aws_iam_role.process_payment_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.orders.arn
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "arn:aws:lambda:*:*:function:complete-order"
      }
    ]
  })
}

resource "aws_lambda_function" "process_payment" {
  filename         = "lambda-builds/process-payment.zip"
  function_name    = "process-payment"
  role             = aws_iam_role.process_payment_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("lambda-builds/process-payment.zip")
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      ORDERS_TABLE = aws_dynamodb_table.orders.name
    }
  }
}

resource "aws_lambda_event_source_mapping" "payment_queue_source" {
  event_source_arn = aws_sqs_queue.payment_queue.arn
  function_name    = aws_lambda_function.process_payment.function_name
  batch_size       = 10
}

# ===== process-shipping Lambda =====

resource "aws_iam_role" "process_shipping_role" {
  name = "process-shipping-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "process_shipping_policy" {
  name = "process-shipping-policy"
  role = aws_iam_role.process_shipping_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.orders.arn
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "arn:aws:lambda:*:*:function:complete-order"
      }
    ]
  })
}

resource "aws_lambda_function" "process_shipping" {
  filename         = "lambda-builds/process-shipping.zip"
  function_name    = "process-shipping"
  role             = aws_iam_role.process_shipping_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("lambda-builds/process-shipping.zip")
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      ORDERS_TABLE = aws_dynamodb_table.orders.name
    }
  }
}

resource "aws_lambda_event_source_mapping" "shipping_queue_source" {
  event_source_arn = aws_sqs_queue.shipping_queue.arn
  function_name    = aws_lambda_function.process_shipping.function_name
  batch_size       = 10
}

# ===== complete-order Lambda =====

resource "aws_iam_role" "complete_order_role" {
  name = "complete-order-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "complete_order_policy" {
  name = "complete-order-policy"
  role = aws_iam_role.complete_order_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.orders.arn
      }
    ]
  })
}

resource "aws_lambda_function" "complete_order" {
  filename         = "lambda-builds/complete-order.zip"
  function_name    = "complete-order"
  role             = aws_iam_role.complete_order_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("lambda-builds/complete-order.zip")
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      ORDERS_TABLE = aws_dynamodb_table.orders.name
    }
  }
}
