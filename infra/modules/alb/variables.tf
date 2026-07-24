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

variable "enable_https" {
  description = "Whether to create the HTTPS listener. Must be statically known at plan time (e.g. derived from var.domain_name != null at the root) — NOT from whether certificate_arn's value happens to be null, since that's a computed attribute unknown until the cert actually exists. Gating count on an unknown value produces a plan Terraform can't save/apply."
  type        = bool
  default     = false
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the HTTPS listener. Only read when enable_https = true; may be unknown at plan time (resolved during apply) — that's fine for a resource attribute, just not for count"
  type        = string
  default     = null
}

variable "tags" {
  type    = map(string)
  default = {}
}
