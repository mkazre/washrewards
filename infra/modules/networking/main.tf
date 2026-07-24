# Fills the networking gap in the existing VPC: it currently has no
# Internet Gateway and no NAT Gateway at all (confirmed via `aws ec2
# describe-internet-gateways` / `describe-nat-gateways` — both empty), so
# despite two subnets named "public," nothing in the VPC can reach the
# internet. This module:
#   1. Attaches an IGW and routes the 2 existing subnets to it (making them
#      genuinely public, for the ALB).
#   2. Creates 2 new private subnets in unused CIDR space, routed through a
#      NAT Gateway (for ECS tasks — outbound to ECR/Secrets Manager/etc).
# The RDS instance and its default subnet group are untouched.

resource "aws_internet_gateway" "this" {
  vpc_id = var.vpc_id
  tags   = merge(var.tags, { Name = "${var.name_prefix}-igw" })
}

resource "aws_route_table" "public" {
  vpc_id = var.vpc_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-public" })
}

resource "aws_route_table_association" "public" {
  count = length(var.existing_public_subnet_ids)

  subnet_id      = var.existing_public_subnet_ids[count.index]
  route_table_id = aws_route_table.public.id
}

# --- New private subnets ---------------------------------------------------

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = var.vpc_id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.existing_public_subnet_azs[count.index]

  tags = merge(var.tags, { Name = "${var.name_prefix}-private-${count.index + 1}" })
}

# --- NAT Gateway(s) ---------------------------------------------------------

locals {
  nat_count = var.single_nat_gateway ? 1 : length(var.existing_public_subnet_ids)
}

resource "aws_eip" "nat" {
  count  = local.nat_count
  domain = "vpc"
  tags   = merge(var.tags, { Name = "${var.name_prefix}-nat-${count.index + 1}" })
}

resource "aws_nat_gateway" "this" {
  count = local.nat_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = var.existing_public_subnet_ids[count.index]

  tags = merge(var.tags, { Name = "${var.name_prefix}-nat-${count.index + 1}" })

  depends_on = [aws_internet_gateway.this]
}

resource "aws_route_table" "private" {
  count = local.nat_count

  vpc_id = var.vpc_id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this[count.index].id
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-private-${count.index + 1}" })
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.single_nat_gateway ? 0 : count.index].id
}
