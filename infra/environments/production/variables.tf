variable "aws_region" {
  type    = string
  default = "af-south-1"
}

# --- Reused existing infrastructure ---------------------------------------
# Filled in from the AWS inventory (existing VPC vpc-00c4e8dd33a1e4c9c and
# RDS instance database-1) — see infra/README.md.

variable "existing_vpc_id" {
  description = "The existing VPC to build into"
  type        = string
}

variable "public_subnet_ids" {
  description = "Existing public subnets (ALB) — needs 2+ across different AZs"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Existing private subnets (ECS tasks, Redis) — needs 2+ across different AZs"
  type        = list(string)
}

variable "existing_db_instance_identifier" {
  description = "The existing RDS instance to point the app at"
  type        = string
  default     = "database-1"
}

# --- New infrastructure ---------------------------------------------------

variable "domain_name" {
  description = "Root domain for Route 53 + ACM. Leave null to skip DNS/HTTPS for now"
  type        = string
  default     = "washrewards.online"
}

variable "mail_from_address" {
  type    = string
  default = "hello@washrewards.online"
}

variable "github_org" {
  type    = string
  default = "mkazre"
}

variable "github_repo" {
  type    = string
  default = "washrewards"
}
