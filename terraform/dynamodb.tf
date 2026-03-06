resource "aws_dynamodb_table" "orders" {
  name           = "orders"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "orderId"
  stream_enabled = false

  attribute {
    name = "orderId"
    type = "S"
  }

  tags = {
    Name = "OrdersTable"
  }
}
