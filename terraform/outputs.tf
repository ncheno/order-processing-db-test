output "api_endpoint" {
  description = "API Gateway endpoint for creating orders"
  value       = "${aws_apigatewayv2_api.orders_api.api_endpoint}/orders"
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.orders_api.id
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for orders"
  value       = aws_dynamodb_table.orders.name
}

output "payment_queue_url" {
  description = "Payment SQS queue URL"
  value       = aws_sqs_queue.payment_queue.url
}

output "shipping_queue_url" {
  description = "Shipping SQS queue URL"
  value       = aws_sqs_queue.shipping_queue.url
}

output "create_order_lambda_name" {
  description = "Create order Lambda function name"
  value       = aws_lambda_function.create_order.function_name
}

output "process_payment_lambda_name" {
  description = "Process payment Lambda function name"
  value       = aws_lambda_function.process_payment.function_name
}

output "process_shipping_lambda_name" {
  description = "Process shipping Lambda function name"
  value       = aws_lambda_function.process_shipping.function_name
}

output "complete_order_lambda_name" {
  description = "Complete order Lambda function name"
  value       = aws_lambda_function.complete_order.function_name
}
