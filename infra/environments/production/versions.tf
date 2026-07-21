terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Created once by infra/bootstrap — see that module's comment header.
  # Native S3 state locking (Terraform >= 1.10, `use_lockfile`) — no
  # DynamoDB lock table needed.
  backend "s3" {
    bucket       = "washrewards-terraform-state"
    key          = "production/terraform.tfstate"
    region       = "af-south-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "washrewards-sa"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}
