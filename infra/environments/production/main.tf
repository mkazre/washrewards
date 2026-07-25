data "aws_vpc" "existing" {
  id = var.existing_vpc_id
}

data "aws_db_instance" "existing" {
  db_instance_identifier = var.existing_db_instance_identifier
}

# --- Networking gap-fill -----------------------------------------------
# The existing VPC has no Internet Gateway or NAT Gateway (confirmed via AWS
# inventory 2026-07-21) — see modules/networking for what this adds.

module "networking" {
  source = "../../modules/networking"

  vpc_id                     = data.aws_vpc.existing.id
  vpc_cidr                   = var.existing_vpc_cidr
  existing_public_subnet_ids = var.existing_public_subnet_ids
  existing_public_subnet_azs = var.existing_public_subnet_azs
}

# Adds a rule to the existing RDS instance's security group so ECS tasks can
# actually reach it — without taking over management of that whole security
# group (which may have other rules from however it was originally set up).
resource "aws_security_group_rule" "rds_from_ecs" {
  type                     = "ingress"
  from_port                = data.aws_db_instance.existing.port
  to_port                  = data.aws_db_instance.existing.port
  protocol                 = "tcp"
  security_group_id        = data.aws_db_instance.existing.vpc_security_groups[0]
  source_security_group_id = aws_security_group.ecs_tasks.id
  description              = "WashRewards ECS tasks"
}

# --- Security group for ECS tasks ------------------------------------------
# Not reusing whatever security groups already exist on the VPC/RDS — a
# fresh, purpose-built one keeps the "what can reach what" story legible
# rather than inheriting rules from however the existing instance/DB were
# originally set up. The rule above grants it access into RDS without this
# module taking over the whole existing RDS security group.

resource "aws_security_group" "ecs_tasks" {
  name        = "washrewards-ecs-tasks"
  description = "WashRewards ECS tasks (API, queue, scheduler) - inbound from ALB only"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description     = "HTTP from the ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [module.alb.alb_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "washrewards-ecs-tasks" }
}

# --- ECR ---------------------------------------------------------------

module "ecr" {
  source          = "../../modules/ecr"
  repository_name = "washrewards-app"
}

module "ecr_website" {
  source          = "../../modules/ecr"
  repository_name = "washrewards-website"
}

# --- ALB (+ WAF) ---------------------------------------------------------

module "alb" {
  source            = "../../modules/alb"
  vpc_id            = data.aws_vpc.existing.id
  public_subnet_ids = module.networking.public_subnet_ids
  enable_https      = var.domain_name != null # statically known — var.domain_name is a plain input, not a computed attribute
  certificate_arn   = var.domain_name != null ? module.dns[0].certificate_arn : null
}

# --- DNS (optional until a domain is provided) -----------------------------

module "dns" {
  count  = var.domain_name != null ? 1 : 0
  source = "../../modules/dns"

  domain_name  = var.domain_name
  alb_dns_name = module.alb.alb_dns_name
  alb_zone_id  = module.alb.alb_zone_id
}

# --- Redis -----------------------------------------------------------------

module "redis" {
  source                    = "../../modules/redis"
  vpc_id                    = data.aws_vpc.existing.id
  private_subnet_ids        = module.networking.private_subnet_ids
  allowed_security_group_id = aws_security_group.ecs_tasks.id
}

# --- S3 media/receipts -----------------------------------------------------

module "storage" {
  source = "../../modules/storage"
}

# --- App secrets -----------------------------------------------------------
#
# DB_PASSWORD is a placeholder — Terraform has no way to read the password
# of a pre-existing RDS instance. After the first apply, set the real value:
#   aws secretsmanager put-secret-value --secret-id washrewards/app-env \
#     --secret-string "$(aws secretsmanager get-secret-value --secret-id washrewards/app-env --query SecretString --output text | jq '.DB_PASSWORD = "the-real-password"')"
# (or edit it in the console — see infra/README.md)

module "secrets" {
  source = "../../modules/secrets"

  secret_values = {
    APP_KEY           = "base64:REPLACE_ME_RUN_php_artisan_key_generate_show"
    APP_URL           = var.domain_name != null ? module.dns[0].api_url : "http://${module.alb.alb_dns_name}"
    DB_HOST           = data.aws_db_instance.existing.address
    DB_PORT           = tostring(data.aws_db_instance.existing.port)
    DB_DATABASE       = "washrewards"
    DB_USERNAME       = data.aws_db_instance.existing.master_username
    DB_PASSWORD       = "REPLACE_ME_MANUALLY"
    REDIS_HOST        = module.redis.primary_endpoint
    REDIS_PORT        = tostring(module.redis.port)
    REDIS_PASSWORD    = module.redis.auth_token
    AWS_BUCKET        = module.storage.bucket_name
    MAIL_MAILER       = "ses"
    MAIL_HOST         = ""
    MAIL_PORT         = "587"
    MAIL_USERNAME     = ""
    MAIL_PASSWORD     = ""
    MAIL_FROM_ADDRESS = var.mail_from_address
    PAYMENT_GATEWAY   = "sandbox" # flip to a real driver once one is chosen — see backend/config/payments.php

    # website/contact.php's SMTP relay — SMTP_PASS is a placeholder same as
    # DB_PASSWORD above; set the real value after apply with:
    #   aws secretsmanager put-secret-value --secret-id washrewards/app-env \
    #     --secret-string "$(aws secretsmanager get-secret-value --secret-id washrewards/app-env --query SecretString --output text | jq '.SMTP_PASS = "the-real-password"')"
    SMTP_HOST     = "mail.washrewards.online"
    SMTP_USER     = "info@washrewards.online"
    SMTP_PASS     = "REPLACE_ME_MANUALLY"
    SMTP_TO_EMAIL = "info@washrewards.online"
  }
}

# --- ECS ---------------------------------------------------------------

module "ecs" {
  source = "../../modules/ecs"

  vpc_id                = data.aws_vpc.existing.id
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = aws_security_group.ecs_tasks.id
  alb_target_group_arn  = module.alb.target_group_arn
  ecr_repository_url    = module.ecr.repository_url
  app_secrets_arn       = module.secrets.secret_arn
  s3_media_bucket_arn   = module.storage.bucket_arn

  media_cloudfront_domain_name = module.storage.cloudfront_domain_name
}

# --- Public website (static + PHP contact form, apex/www) ------------------
# Only created once a domain exists, same as DNS — the ALB listener rule it
# needs (module.dns[0]) doesn't exist without one.

module "website" {
  count  = var.domain_name != null ? 1 : 0
  source = "../../modules/website"

  vpc_id                = data.aws_vpc.existing.id
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = aws_security_group.ecs_tasks.id
  cluster_arn           = module.ecs.cluster_arn
  execution_role_arn    = module.ecs.task_execution_role_arn
  task_role_arn         = module.ecs.task_role_arn
  https_listener_arn    = module.alb.https_listener_arn
  domain_name           = var.domain_name
  ecr_repository_url    = module.ecr_website.repository_url
  app_secrets_arn       = module.secrets.secret_arn
}

# --- CI/CD (GitHub Actions OIDC) --------------------------------------------

module "cicd" {
  source = "../../modules/cicd"

  github_org  = var.github_org
  github_repo = var.github_repo

  ecr_repository_arn          = module.ecr.repository_arn
  website_ecr_repository_arn  = module.ecr_website.repository_arn
  ecs_task_execution_role_arn = module.ecs.task_execution_role_arn
  ecs_task_role_arn           = module.ecs.task_role_arn
}
