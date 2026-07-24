output "public_subnet_ids" {
  value = var.existing_public_subnet_ids
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  value = aws_internet_gateway.this.id
}

output "nat_gateway_ids" {
  value = aws_nat_gateway.this[*].id
}
