variable "name_prefix" {
  type    = string
  default = "washrewards"
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the HTTPS listener. Leave null to skip HTTPS (e.g. before a domain/cert exists) — HTTP-only, not for real use"
  type        = string
  default     = null
}

variable "tags" {
  type    = map(string)
  default = {}
}
