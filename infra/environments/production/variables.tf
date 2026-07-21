variable "aws_region" {
  type    = string
  default = "af-south-1"
}

# --- Reused existing infrastructure ---------------------------------------
# Filled in from the AWS inventory (existing VPC vpc-00c4e8dd33a1e4c9c and
# RDS instance database-1) — see infra/README.md. The VPC has no Internet
# Gateway or NAT Gateway yet (confirmed 2026-07-21) — modules/networking
# adds both; the 2 existing subnets become the public tier, 2 new private
# subnets get created for ECS/Redis.

variable "existing_vpc_id" {
  description = "The existing VPC to build into"
  type        = string
  default     = "vpc-00c4e8dd33a1e4c9c"
}

variable "existing_vpc_cidr" {
  type    = string
  default = "10.0.30.0/24"
}

variable "existing_public_subnet_ids" {
  description = "The 2 existing subnets (uat_public_subnet_1/2) — made genuinely public by modules/networking"
  type        = list(string)
  default     = ["subnet-08c880154929ca146", "subnet-00cf0af006eb54984"]
}

variable "existing_public_subnet_azs" {
  description = "AZs of existing_public_subnet_ids, same order"
  type        = list(string)
  default     = ["af-south-1b", "af-south-1a"]
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
