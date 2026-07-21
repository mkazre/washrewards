# One-time bootstrap: creates the S3 bucket that holds Terraform remote
# state for the real environments (infra/environments/*). Run this once,
# manually, before anything else — it can't depend on the state bucket it's
# creating, so it manages its own local state file (keep infra/bootstrap/
# terraform.tfstate somewhere safe, e.g. commit it or store it securely; it
# only describes this one bucket, no application secrets).
#
#   cd infra/bootstrap
#   terraform init
#   terraform apply -var="state_bucket_name=washrewards-terraform-state"

terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region for the state bucket (should match the app region for simplicity)"
  type        = string
  default     = "af-south-1"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform remote state"
  type        = string
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = var.state_bucket_name

  # Terraform state can contain sensitive values (ARNs, resource IDs, and
  # depending on the resource, occasionally secrets) — never make this public.
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "state_bucket_name" {
  value = aws_s3_bucket.terraform_state.bucket
}
