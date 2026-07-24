variable "name_prefix" {
  type    = string
  default = "washrewards"
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "allowed_security_group_id" {
  description = "Security group (ECS tasks) allowed to reach Redis on 6379"
  type        = string
}

variable "node_type" {
  type    = string
  default = "cache.t3.small" # matches tech spec §7.3 starting recommendation
}

variable "tags" {
  type    = map(string)
  default = {}
}

resource "aws_security_group" "redis" {
  name        = "${var.name_prefix}-redis"
  description = "WashRewards Redis - only ECS tasks can connect"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from ECS tasks"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [var.allowed_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.name_prefix}-redis"
  subnet_ids = var.private_subnet_ids
  tags       = var.tags
}

# transit_encryption_enabled requires an AUTH token to actually be useful —
# without one, TLS is on but the connection is unauthenticated. Generated
# here and exposed as an output so the caller can put it in the app's
# Secrets Manager entry as REDIS_PASSWORD; never logged or written to state
# in plaintext anywhere else.
resource "random_password" "redis_auth" {
  length  = 32
  special = false # ElastiCache AUTH tokens can't contain some special characters
}

# Replication group (not a single cache cluster) so we get a primary +
# replica with automatic failover, matching the tech spec's "1 primary + 1
# replica" recommendation.
resource "aws_elasticache_replication_group" "this" {
  replication_group_id = "${var.name_prefix}-redis"
  description          = "WashRewards cache/session/queue store"

  engine             = "redis"
  node_type          = var.node_type
  num_cache_clusters = 2

  automatic_failover_enabled = true
  multi_az_enabled           = true

  subnet_group_name  = aws_elasticache_subnet_group.this.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result

  snapshot_retention_limit = 5

  tags = var.tags
}

output "primary_endpoint" {
  value = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "port" {
  value = aws_elasticache_replication_group.this.port
}

output "security_group_id" {
  value = aws_security_group.redis.id
}

output "auth_token" {
  value     = random_password.redis_auth.result
  sensitive = true
}
