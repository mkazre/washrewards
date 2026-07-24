variable "name_prefix" {
  type    = string
  default = "washrewards"
}

variable "vpc_id" {
  description = "Existing VPC to build networking into"
  type        = string
}

variable "vpc_cidr" {
  description = "The existing VPC's CIDR block, so new private subnets can be carved from unused space in it"
  type        = string
}

variable "existing_public_subnet_ids" {
  description = "The 2 existing subnets (one per AZ) to make genuinely public — attaching the IGW and routing them to it"
  type        = list(string)
}

variable "existing_public_subnet_azs" {
  description = "Availability zones of existing_public_subnet_ids, same order — needed to place the new private subnets in matching AZs"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDRs for the 2 new private subnets to create, one per AZ in existing_public_subnet_azs"
  type        = list(string)
  default     = ["10.0.30.128/27", "10.0.30.160/27"]
}

variable "single_nat_gateway" {
  description = "Use one NAT Gateway (cheaper, ~$35/mo) instead of one per AZ (more resilient, ~$70/mo). Fine to start; add a second later if an AZ outage taking down outbound internet for both private subnets becomes a real concern"
  type        = bool
  default     = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
