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

variable "ecs_security_group_id" {
  type = string
}

variable "alb_target_group_arn" {
  type = string
}

variable "ecr_repository_url" {
  type = string
}

variable "image_tag" {
  description = "Docker image tag to deploy — Terraform manages the task definition shape; CI updates just this on each deploy"
  type        = string
  default     = "main"
}

variable "app_secrets_arn" {
  description = "Secrets Manager secret ARN holding the Laravel .env-equivalent key/value pairs"
  type        = string
}

variable "s3_media_bucket_arn" {
  type = string
}

variable "media_cloudfront_domain_name" {
  description = "CloudFront domain fronting the private media bucket — becomes AWS_URL so Storage::url() returns reachable (CDN) URLs instead of the blocked raw S3 host"
  type        = string
}

variable "log_retention_days" {
  type    = number
  default = 30
}

# --- Sizing (matches the tech spec §7.2 starting recommendation) ---------

variable "api_cpu" {
  type    = number
  default = 1024 # 1 vCPU
}

variable "api_memory" {
  type    = number
  default = 2048 # 2 GB
}

variable "api_desired_count" {
  type    = number
  default = 2
}

variable "api_min_count" {
  type    = number
  default = 2
}

variable "api_max_count" {
  type    = number
  default = 6
}

variable "queue_cpu" {
  type    = number
  default = 512 # 0.5 vCPU
}

variable "queue_memory" {
  type    = number
  default = 1024 # 1 GB
}

variable "queue_desired_count" {
  type    = number
  default = 1
}

variable "queue_max_count" {
  type    = number
  default = 2
}

variable "tags" {
  type    = map(string)
  default = {}
}
