data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

resource "aws_ecs_cluster" "this" {
  name = "${var.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = var.tags
}

# --- Logs ------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.name_prefix}/api"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "queue" {
  name              = "/ecs/${var.name_prefix}/queue"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "scheduler" {
  name              = "/ecs/${var.name_prefix}/scheduler"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

# --- IAM ---------------------------------------------------------------

# Execution role: what ECS itself needs (pull the image, write logs, read
# the secrets referenced in the task definition's `secrets` block).
data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "${var.name_prefix}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "execution_secrets" {
  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.app_secrets_arn]
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  name   = "read-app-secrets"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_secrets.json
}

# Task role: what the running application itself is allowed to do (S3 media
# uploads/receipts). Kept separate from the execution role on purpose — the
# app should never be able to read other secrets or manage ECS itself.
resource "aws_iam_role" "task" {
  name               = "${var.name_prefix}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
  tags               = var.tags
}

data "aws_iam_policy_document" "task_permissions" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${var.s3_media_bucket_arn}/*"]
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [var.s3_media_bucket_arn]
  }
  # OTP delivery (App\Sms\Drivers\SnsSmsSender) once "AWS SNS" is selected in
  # the admin Settings page. Direct-to-phone-number Publish needs no SNS
  # topic resource, just this permission — resources = ["*"] is SNS's own
  # documented requirement for that call shape (there's no topic ARN to
  # scope to when publishing straight to a PhoneNumber).
  statement {
    effect    = "Allow"
    actions   = ["sns:Publish"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "task_permissions" {
  name   = "app-permissions"
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task_permissions.json
}

# --- API + Admin service ---------------------------------------------------

locals {
  image = "${var.ecr_repository_url}:${var.image_tag}"

  # The media bucket blocks all public access (Block Public Access + no public
  # bucket policy) and is only reachable through CloudFront's Origin Access
  # Control. Laravel's S3 disk builds public URLs from `AWS_URL` when set
  # (see config/filesystems.php) — without it, Storage::url() falls back to
  # the raw S3 host, which 403s for anyone but CloudFront itself.
  aws_url_env = { name = "AWS_URL", value = "https://${var.media_cloudfront_domain_name}" }

  # Every container needs the same Laravel env — pulled from one Secrets
  # Manager JSON secret rather than one entry per key, to keep the task
  # definition (and this module) from having to know every env var name.
  app_secrets_env = [
    for key in [
      "APP_KEY", "APP_URL", "DB_HOST", "DB_PORT", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD",
      "REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD", "AWS_BUCKET", "MAIL_MAILER", "MAIL_HOST", "MAIL_PORT",
      "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM_ADDRESS", "PAYMENT_GATEWAY",
      ] : {
      name      = key
      valueFrom = "${var.app_secrets_arn}:${key}::"
    }
  ]
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.name_prefix}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name         = "api"
      image        = local.image
      essential    = true
      portMappings = [{ containerPort = 80, protocol = "tcp" }]
      environment = [
        { name = "APP_ENV", value = "production" },
        { name = "APP_DEBUG", value = "false" },
        { name = "LOG_CHANNEL", value = "stderr" },
        { name = "DB_CONNECTION", value = "mysql" },
        { name = "AWS_DEFAULT_REGION", value = data.aws_region.current.name },
        { name = "REDIS_SCHEME", value = "tls" }, # ElastiCache has transit_encryption_enabled — see modules/redis
        { name = "SESSION_DRIVER", value = "redis" },
        { name = "CACHE_STORE", value = "redis" },
        { name = "QUEUE_CONNECTION", value = "redis" },
        { name = "FILESYSTEM_DISK", value = "s3" },
        local.aws_url_env,
      ]
      secrets = local.app_secrets_env
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "api"
        }
      }
    }
  ])

  tags = var.tags
}

resource "aws_ecs_service" "api" {
  name            = "${var.name_prefix}-api"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [var.ecs_security_group_id]
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "api"
    container_port   = 80
  }

  # CI updates the task definition's image tag directly (register a new
  # revision + update-service); don't fight that on the next `terraform
  # apply` by forcing back to whatever image tag was last applied here.
  lifecycle {
    ignore_changes = [task_definition]
  }

  tags = var.tags
}

resource "aws_appautoscaling_target" "api" {
  max_capacity       = var.api_max_count
  min_capacity       = var.api_min_count
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${var.name_prefix}-api-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 65
  }
}

# --- Queue worker service ---------------------------------------------------

resource "aws_ecs_task_definition" "queue" {
  family                   = "${var.name_prefix}-queue"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.queue_cpu
  memory                   = var.queue_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "queue"
      image     = local.image
      essential = true
      command   = ["php", "artisan", "queue:work", "--tries=3", "--max-time=3600"]
      environment = [
        { name = "APP_ENV", value = "production" },
        { name = "APP_DEBUG", value = "false" },
        { name = "LOG_CHANNEL", value = "stderr" },
        { name = "DB_CONNECTION", value = "mysql" },
        { name = "AWS_DEFAULT_REGION", value = data.aws_region.current.name },
        { name = "REDIS_SCHEME", value = "tls" }, # ElastiCache has transit_encryption_enabled — see modules/redis
        { name = "SESSION_DRIVER", value = "redis" },
        { name = "CACHE_STORE", value = "redis" },
        { name = "QUEUE_CONNECTION", value = "redis" },
        { name = "FILESYSTEM_DISK", value = "s3" },
        local.aws_url_env,
      ]
      secrets = local.app_secrets_env
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.queue.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "queue"
        }
      }
    }
  ])

  tags = var.tags
}

resource "aws_ecs_service" "queue" {
  name            = "${var.name_prefix}-queue"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.queue.arn
  desired_count   = var.queue_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [var.ecs_security_group_id]
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  tags = var.tags
}

resource "aws_appautoscaling_target" "queue" {
  max_capacity       = var.queue_max_count
  min_capacity       = var.queue_desired_count
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.queue.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "queue_cpu" {
  name               = "${var.name_prefix}-queue-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.queue.resource_id
  scalable_dimension = aws_appautoscaling_target.queue.scalable_dimension
  service_namespace  = aws_appautoscaling_target.queue.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70
  }
}

# --- Scheduler: `php artisan schedule:run` every minute ---------------------
#
# Fargate has no cron primitive of its own, so Laravel's own scheduler (which
# expects something to invoke `schedule:run` every minute) is driven by
# EventBridge Scheduler launching a one-off Fargate task on the same image.

resource "aws_ecs_task_definition" "scheduler" {
  family                   = "${var.name_prefix}-scheduler"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "scheduler"
      image     = local.image
      essential = true
      command   = ["php", "artisan", "schedule:run"]
      environment = [
        { name = "APP_ENV", value = "production" },
        { name = "APP_DEBUG", value = "false" },
        { name = "LOG_CHANNEL", value = "stderr" },
        { name = "DB_CONNECTION", value = "mysql" },
        { name = "AWS_DEFAULT_REGION", value = data.aws_region.current.name },
        { name = "REDIS_SCHEME", value = "tls" }, # ElastiCache has transit_encryption_enabled — see modules/redis
        { name = "CACHE_STORE", value = "redis" },
        { name = "QUEUE_CONNECTION", value = "redis" },
      ]
      secrets = local.app_secrets_env
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.scheduler.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "scheduler"
        }
      }
    }
  ])

  tags = var.tags
}

data "aws_iam_policy_document" "scheduler_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "scheduler" {
  name               = "${var.name_prefix}-eventbridge-scheduler"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume.json
  tags               = var.tags
}

data "aws_iam_policy_document" "scheduler_run_task" {
  statement {
    effect    = "Allow"
    actions   = ["ecs:RunTask"]
    resources = [replace(aws_ecs_task_definition.scheduler.arn, "/:\\d+$/", ":*")]
  }
  statement {
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.execution.arn, aws_iam_role.task.arn]
  }
}

resource "aws_iam_role_policy" "scheduler_run_task" {
  name   = "run-scheduler-task"
  role   = aws_iam_role.scheduler.id
  policy = data.aws_iam_policy_document.scheduler_run_task.json
}

resource "aws_scheduler_schedule" "laravel_scheduler" {
  name                         = "${var.name_prefix}-schedule-run"
  schedule_expression          = "rate(1 minute)"
  schedule_expression_timezone = "Africa/Johannesburg"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_ecs_cluster.this.arn
    role_arn = aws_iam_role.scheduler.arn

    ecs_parameters {
      # An ARN *without* the trailing :revision — EventBridge Scheduler's API
      # requires something ARN-shaped (a bare family name errors with
      # "invalid prefix"), but ECS still resolves an ARN with no revision
      # suffix to the latest ACTIVE revision at invocation time, same as a
      # bare family name would. So a new image pushed by CI still takes
      # effect on the very next minute's run without Terraform involvement.
      task_definition_arn = "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:task-definition/${aws_ecs_task_definition.scheduler.family}"
      launch_type         = "FARGATE"
      task_count          = 1

      network_configuration {
        subnets          = var.private_subnet_ids
        security_groups  = [var.ecs_security_group_id]
        assign_public_ip = false
      }
    }

    retry_policy {
      maximum_retry_attempts = 1
    }
  }
}
