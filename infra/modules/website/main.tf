# Public marketing site (static index.html + PHP contact form) — a small,
# separate ECS Fargate service so a site content change never requires
# redeploying the Laravel app. Reuses the app's ALB/cluster/execution role;
# routed by Host header so api.<domain> keeps hitting the Laravel service
# while <domain>/www.<domain> land here.

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

variable "cluster_arn" {
  type = string
}

variable "execution_role_arn" {
  type = string
}

variable "task_role_arn" {
  type = string
}

variable "https_listener_arn" {
  type = string
}

variable "domain_name" {
  description = "Apex domain the site is served on, e.g. washrewards.online"
  type        = string
}

variable "ecr_repository_url" {
  type = string
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "app_secrets_arn" {
  description = "Secrets Manager ARN holding the SMTP_* keys for contact.php"
  type        = string
}

variable "cpu" {
  type    = number
  default = 256
}

variable "memory" {
  type    = number
  default = 512
}

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "tags" {
  type    = map(string)
  default = {}
}

resource "aws_lb_target_group" "website" {
  name        = "${var.name_prefix}-website"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/up"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200"
  }

  tags = var.tags
}

# Priority lower than the ALB's default (unranked) forward-to-API action, so
# host matches here are evaluated before falling through to the API.
resource "aws_lb_listener_rule" "website_https" {
  listener_arn = var.https_listener_arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.website.arn
  }

  condition {
    host_header {
      values = [var.domain_name, "www.${var.domain_name}"]
    }
  }
}

resource "aws_cloudwatch_log_group" "website" {
  name              = "/ecs/${var.name_prefix}/website"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_ecs_task_definition" "website" {
  family                   = "${var.name_prefix}-website"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "website"
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true

      portMappings = [{ containerPort = 80, protocol = "tcp" }]

      secrets = [
        for key in ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_TO_EMAIL"] : {
          name      = key
          valueFrom = "${var.app_secrets_arn}:${key}::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.website.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "website"
        }
      }
    }
  ])

  tags = var.tags
}

data "aws_region" "current" {}

resource "aws_ecs_service" "website" {
  name            = "${var.name_prefix}-website"
  cluster         = var.cluster_arn
  task_definition = aws_ecs_task_definition.website.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.website.arn
    container_name   = "website"
    container_port   = 80
  }

  depends_on = [aws_lb_listener_rule.website_https]

  tags = var.tags
}

output "service_name" {
  value = aws_ecs_service.website.name
}

output "target_group_arn" {
  value = aws_lb_target_group.website.arn
}
